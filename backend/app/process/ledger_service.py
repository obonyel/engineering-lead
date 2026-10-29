"""Process Layer — Two-Phase Biometric HITL Gate & Double-Entry Ledger Service.

Architectural Law (ADR-005):
  1. `stage_transfer` ONLY writes a `PENDING_APPROVAL` record. Account balances NEVER change.
  2. `confirm_approval` requires BOTH a unique `X-Idempotency-Key` AND a verified
     Android `biometric_attestation_id` before executing balanced DEBIT/CREDIT ledger entries.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.models.domain import (
    ConfirmApprovalRequest,
    LedgerEntryRecord,
    SettlementReceiptResponse,
    StageApprovalRequest,
    StagedApprovalResponse,
)
from app.process.guardrails import (
    EFT_RTC_FEE_CENTS,
    PAYSHAP_FEE_CENTS,
    compare_payment_rails,
    evaluate_safe_float,
)
from app.system.rail_adapters import PayShapSimAdapter
from app.system.repository import InMemoryDemoRepository, StoredApproval, build_expiry


class BankingRuleError(ValueError):
    """Domain error mapped to RFC 9457 Problem Details by the API router."""

    def __init__(self, title: str, detail: str, status_code: int = 400) -> None:
        super().__init__(detail)
        self.title = title
        self.detail = detail
        self.status_code = status_code


class LedgerService:
    def __init__(
        self,
        repo: InMemoryDemoRepository,
        payshap_adapter: PayShapSimAdapter | None = None,
    ) -> None:
        self.repo = repo
        self.payshap_adapter = payshap_adapter or PayShapSimAdapter()

    def stage_transfer(
        self,
        user_id: str,
        req: StageApprovalRequest,
        correlation_id: str,
    ) -> StagedApprovalResponse:
        source = self.repo.accounts.get(req.source_account_id)
        if not source:
            raise BankingRuleError(
                "Source Account Not Found",
                f"Account '{req.source_account_id}' does not exist.",
                status_code=404,
            )
        if source.status != "ACTIVE":
            raise BankingRuleError(
                "Account Not Active",
                f"Account '{source.name}' cannot fund transfers while {source.status}.",
                status_code=409,
            )

        fee_cents = EFT_RTC_FEE_CENTS if req.rail == "EFT_RTC" else PAYSHAP_FEE_CENTS
        total_debit_cents = req.amount_cents + fee_cents
        safe_float = evaluate_safe_float(
            balance_cents=source.balance_cents,
            debit_total_cents=total_debit_cents,
            safe_float_floor_cents=self.repo.safe_float_zar_cents,
        )
        if safe_float.balance_after_cents < 0:
            raise BankingRuleError(
                "Insufficient Available Balance",
                f"Transfer + fee requires R{total_debit_cents / 100:,.2f}, "
                f"but '{source.name}' holds R{source.balance_cents / 100:,.2f}.",
                status_code=422,
            )

        beneficiary_name = "High-Yield Notice Stash"
        shap_id: str | None = None
        if req.beneficiary_id:
            ben = self.repo.beneficiaries.get(req.beneficiary_id)
            if not ben:
                raise BankingRuleError(
                    "Beneficiary Not Found",
                    f"Beneficiary '{req.beneficiary_id}' is not registered.",
                    status_code=404,
                )
            beneficiary_name = ben.display_name
            shap_id = ben.shap_id

        approval_id = f"apr_{uuid.uuid4().hex[:12]}"
        expires_at = build_expiry(15)
        stored = StoredApproval(
            id=approval_id,
            user_id=user_id,
            action_type=req.action_type,
            status="PENDING_APPROVAL",
            source_account_id=req.source_account_id,
            destination_account_id=req.destination_account_id,
            beneficiary_id=req.beneficiary_id,
            beneficiary_name=beneficiary_name,
            shap_id=shap_id,
            amount_cents=req.amount_cents,
            fee_cents=fee_cents,
            rail=req.rail,
            reference=req.reference,
            agent_name=req.agent_name,
            safe_float_after_cents=safe_float.balance_after_cents,
            expires_at=expires_at,
        )
        self.repo.save_staged_approval(stored, correlation_id=correlation_id)

        return StagedApprovalResponse(
            approval_id=approval_id,
            status="PENDING_APPROVAL",
            action_type=req.action_type,
            source_account_id=req.source_account_id,
            beneficiary_name=beneficiary_name,
            shap_id=shap_id,
            amount_cents=req.amount_cents,
            fee_cents=fee_cents,
            rail=req.rail,
            reference=req.reference,
            safe_float=safe_float,
            rail_comparison=compare_payment_rails(req.rail),
            expires_at=expires_at,
        )

    def confirm_approval(
        self,
        *,
        user_id: str,
        approval_id: str,
        idempotency_key: str,
        req: ConfirmApprovalRequest,
        correlation_id: str,
    ) -> SettlementReceiptResponse:
        if not idempotency_key or len(idempotency_key.strip()) < 8:
            raise BankingRuleError(
                "Missing X-Idempotency-Key",
                "Every financial mutation must carry a unique X-Idempotency-Key (>= 8 chars).",
                status_code=400,
            )

        # Idempotent replay check: return exact settled receipt without double-debiting
        if idempotency_key in self.repo.receipts_by_idempotency:
            return self.repo.receipts_by_idempotency[idempotency_key]

        approval = self.repo.approvals.get(approval_id)
        if not approval or approval.user_id != user_id:
            raise BankingRuleError(
                "Approval Request Not Found",
                f"Approval '{approval_id}' does not exist for this user.",
                status_code=404,
            )

        if approval.status != "PENDING_APPROVAL":
            raise BankingRuleError(
                "Approval Already Finalized",
                f"Approval '{approval_id}' is already in state '{approval.status}'.",
                status_code=409,
            )

        if datetime.now(timezone.utc) > approval.expires_at:
            approval.status = "EXPIRED"
            raise BankingRuleError(
                "Approval Expired",
                "Staged HITL approval expired after 15 minutes. Ask Copilot to re-stage.",
                status_code=410,
            )

        if req.decision == "REJECT":
            approval.status = "REJECTED"
            approval.decided_at = datetime.now(timezone.utc)
            self.repo.append_audit_event(
                user_id=user_id,
                actor="USER_BIOMETRIC_HITL",
                event_type="APPROVAL_REJECTED",
                entity_type="approval_request",
                entity_id=approval_id,
                correlation_id=correlation_id,
                payload={"decision": "REJECT"},
            )
            source = self.repo.accounts[approval.source_account_id]
            rejected_receipt = SettlementReceiptResponse(
                transaction_id=f"tx_rej_{uuid.uuid4().hex[:10]}",
                approval_id=approval_id,
                idempotency_key=idempotency_key,
                status="REJECTED",
                rail=approval.rail,
                amount_cents=approval.amount_cents,
                fee_cents=0,
                beneficiary_name=approval.beneficiary_name,
                shap_id=approval.shap_id,
                reference=approval.reference,
                new_account_balance_cents=source.balance_cents,
                entries=[],
                settled_at=approval.decided_at,
                whatsapp_receipt_text="Transfer cancelled safely by account holder.",
            )
            self.repo.receipts_by_idempotency[idempotency_key] = rejected_receipt
            return rejected_receipt

        # Biometric step-up check: mandatory before touching ledger balances
        if not req.biometric_attestation_id or len(req.biometric_attestation_id.strip()) < 6:
            raise BankingRuleError(
                "Biometric Clearance Required",
                "Android BiometricPrompt attestation is required before settling funds (ADR-005).",
                status_code=403,
            )

        source = self.repo.accounts[approval.source_account_id]
        total_debit = approval.amount_cents + approval.fee_cents
        if source.balance_cents < total_debit:
            raise BankingRuleError(
                "Insufficient Available Balance",
                "Balance changed since staging; insufficient funds to settle.",
                status_code=422,
            )

        dispatch = self.payshap_adapter.dispatch_transfer(
            shap_id=approval.shap_id,
            amount_cents=approval.amount_cents,
            reference=approval.reference,
            rail=approval.rail,
        )

        # Atomic double-entry mutation (SUM(DEBIT) == SUM(CREDIT))
        tx_id = f"tx_{uuid.uuid4().hex[:12]}"
        credit_target = (
            approval.destination_account_id
            or approval.shap_id
            or f"beneficiary:{approval.beneficiary_name}"
        )
        entries: list[LedgerEntryRecord] = [
            LedgerEntryRecord(
                id=f"le_{uuid.uuid4().hex[:10]}",
                transaction_id=tx_id,
                account_ref=source.id,
                direction="DEBIT",
                amount_cents=approval.amount_cents,
            ),
            LedgerEntryRecord(
                id=f"le_{uuid.uuid4().hex[:10]}",
                transaction_id=tx_id,
                account_ref=credit_target,
                direction="CREDIT",
                amount_cents=approval.amount_cents,
            ),
        ]
        if approval.fee_cents > 0:
            entries.extend(
                [
                    LedgerEntryRecord(
                        id=f"le_{uuid.uuid4().hex[:10]}",
                        transaction_id=tx_id,
                        account_ref=source.id,
                        direction="DEBIT",
                        amount_cents=approval.fee_cents,
                    ),
                    LedgerEntryRecord(
                        id=f"le_{uuid.uuid4().hex[:10]}",
                        transaction_id=tx_id,
                        account_ref="sahara:rail_fee_clearing",
                        direction="CREDIT",
                        amount_cents=approval.fee_cents,
                    ),
                ]
            )

        debit_sum = sum(e.amount_cents for e in entries if e.direction == "DEBIT")
        credit_sum = sum(e.amount_cents for e in entries if e.direction == "CREDIT")
        assert debit_sum == credit_sum, "Double-entry accounting invariant violated."

        updated_source = source.model_copy(
            update={"balance_cents": source.balance_cents - total_debit}
        )
        self.repo.accounts[source.id] = updated_source

        dest_id = approval.destination_account_id
        if dest_id and dest_id in self.repo.accounts:
            dest = self.repo.accounts[dest_id]
            self.repo.accounts[dest.id] = dest.model_copy(
                update={"balance_cents": dest.balance_cents + approval.amount_cents}
            )

        if approval.beneficiary_id and approval.beneficiary_id in self.repo.beneficiaries:
            ben = self.repo.beneficiaries[approval.beneficiary_id]
            self.repo.beneficiaries[ben.id] = ben.model_copy(
                update={"monthly_spent_cents": ben.monthly_spent_cents + approval.amount_cents}
            )

        self.repo.ledger_entries.extend(entries)
        approval.status = "APPROVED"
        approval.biometric_attestation_id = req.biometric_attestation_id
        approval.idempotency_key = idempotency_key
        approval.decided_at = dispatch.settled_at

        self.repo.append_audit_event(
            user_id=user_id,
            actor="USER_BIOMETRIC_HITL",
            event_type="LEDGER_SETTLED",
            entity_type="ledger_transaction",
            entity_id=tx_id,
            correlation_id=correlation_id,
            payload={
                "approval_id": approval_id,
                "network_reference": dispatch.network_reference,
                "amount_cents": approval.amount_cents,
                "fee_cents": approval.fee_cents,
                "biometric_attestation_id": req.biometric_attestation_id,
            },
        )

        receipt = SettlementReceiptResponse(
            transaction_id=tx_id,
            approval_id=approval_id,
            idempotency_key=idempotency_key,
            status="SETTLED",
            rail=approval.rail,
            amount_cents=approval.amount_cents,
            fee_cents=approval.fee_cents,
            beneficiary_name=approval.beneficiary_name,
            shap_id=approval.shap_id,
            reference=approval.reference,
            new_account_balance_cents=updated_source.balance_cents,
            entries=entries,
            settled_at=dispatch.settled_at,
            whatsapp_receipt_text=(
                f"Sahara Mzansi PayShap Proof: Paid R{approval.amount_cents / 100:,.2f} "
                f"to {approval.beneficiary_name} ({approval.shap_id or 'Verified Account'}) "
                f"· Ref: {approval.reference} · Net Ref: {dispatch.network_reference}."
            ),
        )
        self.repo.receipts_by_idempotency[idempotency_key] = receipt
        return receipt
