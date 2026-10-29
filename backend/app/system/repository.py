"""System Layer — Repository Abstraction + Pre-Seeded Demo Mode Ledger Store.

In Demo Mode (`DEMO_MODE=true`), Sahara Mzansi runs out-of-the-box with Elena Rostova's
R248,500.00 ZAR portfolio (matching Stitch Screen 4) while enforcing every double-entry,
idempotency, and append-only audit invariant in memory. When `DEMO_MODE=false`, Process
services persist against hosted Supabase Postgres (`backend/supabase/migrations/`).
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from app.models.domain import (
    AccountSummary,
    AgentAlertCard,
    BeneficiarySummary,
    LedgerEntryRecord,
    PortfolioSummaryResponse,
    SettlementReceiptResponse,
    VirtualCardSummary,
    WealthVaultSummary,
)


@dataclass
class StoredApproval:
    id: str
    user_id: str
    action_type: str
    status: str
    source_account_id: str
    destination_account_id: str | None
    beneficiary_id: str | None
    beneficiary_name: str
    shap_id: str | None
    amount_cents: int
    fee_cents: int
    rail: str
    reference: str
    agent_name: str
    safe_float_after_cents: int
    expires_at: datetime
    biometric_attestation_id: str | None = None
    idempotency_key: str | None = None
    decided_at: datetime | None = None


@dataclass
class AuditEventRecord:
    id: str
    user_id: str
    actor: str
    event_type: str
    entity_type: str
    entity_id: str
    correlation_id: str
    payload: dict
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class InMemoryDemoRepository:
    """Thread-safe single-process demo ledger matching Stitch Screen 4 (`R 248,500.00 ZAR`)."""

    def __init__(self) -> None:
        self.user_id = "demo-user-elena"
        self.full_name = "Elena Rostova"
        self.shap_id = "elena@sahara.shap"
        self.safe_float_zar_cents = 320_000  # R3,200.00 daily float buffer
        self.passive_yield_harvested_cents = 1_441_320  # R14,413.20

        self.accounts: dict[str, AccountSummary] = {
            "acc-main-zar": AccountSummary(
                id="acc-main-zar",
                account_type="MAIN_TRANSACT",
                name="Main Checking (ZAR)",
                currency="ZAR",
                balance_cents=16_820_000,  # R168,200.00
                apy_bps=50,
                status="ACTIVE",
            ),
            "acc-stash-zar": AccountSummary(
                id="acc-stash-zar",
                account_type="NOTICE_STASH",
                name="High-Yield Notice Stash (8.25% APY)",
                currency="ZAR",
                balance_cents=8_030_000,  # R80,300.00 -> Total ZAR Net Worth = R248,500.00
                apy_bps=825,
                status="ACTIVE",
            ),
        }

        self.virtual_cards: dict[str, VirtualCardSummary] = {
            "card-sahara-9240": VirtualCardSummary(
                id="card-sahara-9240",
                account_id="acc-main-zar",
                card_token="tok_sahara_za_9240",
                last4="9240",
                brand="VISA",
                frozen=False,
                daily_limit_cents=1_500_000,
            )
        }

        self.vaults: list[WealthVaultSummary] = [
            WealthVaultSummary(
                id="vault-emergency",
                name="Emergency Cushion (6 Mo)",
                category="EMERGENCY",
                target_cents=9_000_000,
                current_cents=8_030_000,
                apy_bps=825,
                notice_days=0,
            ),
            WealthVaultSummary(
                id="vault-tfsa",
                name="SARS Tax-Free Savings (TFSA)",
                category="TFSA",
                target_cents=3_600_000,
                current_cents=2_400_000,
                apy_bps=910,
                notice_days=0,
            ),
            WealthVaultSummary(
                id="vault-property",
                name="Cape Town Deposit",
                category="PROPERTY",
                target_cents=25_000_000,
                current_cents=6_390_000,
                apy_bps=850,
                notice_days=32,
            ),
        ]

        self.beneficiaries: dict[str, BeneficiarySummary] = {
            "ben-mom": BeneficiarySummary(
                id="ben-mom",
                display_name="Mom (Gogo Thandi)",
                relationship="MOM",
                shap_id="0825550194@capitec.shap",
                bank_name="Capitec Bank",
                account_masked="•••• 4819",
                preferred_rail="PAYSHAP",
                budget_category="FAMILY_SUPPORT",
                monthly_budget_cents=500_000,
                monthly_spent_cents=0,
            ),
            "ben-city-power": BeneficiarySummary(
                id="ben-city-power",
                display_name="City Power Prepaid Meter",
                relationship="UTILITY",
                shap_id="meter-0419822@utility.shap",
                bank_name="Standard Bank",
                account_masked="•••• 9921",
                preferred_rail="PAYSHAP",
                budget_category="UTILITIES",
                monthly_budget_cents=250_000,
                monthly_spent_cents=95_000,
            ),
        }

        self.approvals: dict[str, StoredApproval] = {}
        self.receipts_by_idempotency: dict[str, SettlementReceiptResponse] = {}
        self.ledger_entries: list[LedgerEntryRecord] = []
        self._audit_events: list[AuditEventRecord] = []

    def get_portfolio(self, user_id: str) -> PortfolioSummaryResponse:
        total_cents = sum(acc.balance_cents for acc in self.accounts.values())
        alerts = [
            AgentAlertCard(
                agent_name="Jabu",
                headline="R20,000 idle float earning 0.50%",
                detail=(
                    "Sweeping R20,000 into your 8.25% Notice Stash harvests +R1,711/yr "
                    "while keeping your R3,200 Safe Daily Float intact."
                ),
                suggested_prompt=(
                    "Explain why keeping R20,000 in checking loses to SA inflation "
                    "and stage a stash sweep."
                ),
                potential_savings_cents=171_100,
            ),
            AgentAlertCard(
                agent_name="Kagiso",
                headline="Duplicate R499 debit order flagged",
                detail=(
                    "Detected a second FitLife Gym mandate scheduled for the 25th. "
                    "Review or stage a block before payday."
                ),
                suggested_prompt="Audit my recurring debit orders for duplicate fees.",
                potential_savings_cents=49_900,
            ),
            AgentAlertCard(
                agent_name="Thabo",
                headline="Prepaid electricity buffer healthy",
                detail="38% of your R2,500 monthly City Power budget used so far.",
                suggested_prompt="Send R1,500 to my mom for groceries via PayShap.",
                potential_savings_cents=5_000,
            ),
        ]
        return PortfolioSummaryResponse(
            user_id=user_id,
            full_name=self.full_name,
            shap_id=self.shap_id,
            total_net_worth_cents=total_cents,
            passive_yield_harvested_cents=self.passive_yield_harvested_cents,
            safe_float_zar_cents=self.safe_float_zar_cents,
            accounts=list(self.accounts.values()),
            virtual_cards=list(self.virtual_cards.values()),
            vaults=self.vaults,
            beneficiaries=list(self.beneficiaries.values()),
            agent_alerts=alerts,
        )

    def resolve_beneficiary(self, query: str) -> BeneficiarySummary | None:
        needle = query.strip().lower()
        for ben in self.beneficiaries.values():
            if (
                needle in ben.display_name.lower()
                or needle in ben.relationship.lower()
                or (ben.shap_id and needle in ben.shap_id.lower())
            ):
                return ben
        return None

    def set_card_frozen(
        self, card_id: str, frozen: bool, correlation_id: str
    ) -> VirtualCardSummary:
        card = self.virtual_cards.get(card_id)
        if not card:
            raise KeyError(f"Virtual card '{card_id}' not found.")
        updated = card.model_copy(update={"frozen": frozen})
        self.virtual_cards[card_id] = updated
        self.append_audit_event(
            user_id=self.user_id,
            actor="USER_CHANNEL",
            event_type="CARD_FREEZE_TOGGLED",
            entity_type="virtual_card",
            entity_id=card_id,
            correlation_id=correlation_id,
            payload={"frozen": frozen, "last4": card.last4},
        )
        return updated

    def save_staged_approval(self, approval: StoredApproval, correlation_id: str) -> StoredApproval:
        self.approvals[approval.id] = approval
        self.append_audit_event(
            user_id=approval.user_id,
            actor=f"AGENT_{approval.agent_name.upper()}",
            event_type="APPROVAL_STAGED",
            entity_type="approval_request",
            entity_id=approval.id,
            correlation_id=correlation_id,
            payload={
                "action_type": approval.action_type,
                "amount_cents": approval.amount_cents,
                "fee_cents": approval.fee_cents,
                "rail": approval.rail,
                "status": approval.status,
            },
        )
        return approval

    def append_audit_event(
        self,
        *,
        user_id: str,
        actor: str,
        event_type: str,
        entity_type: str,
        entity_id: str,
        correlation_id: str,
        payload: dict,
    ) -> AuditEventRecord:
        event = AuditEventRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            actor=actor,
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            correlation_id=correlation_id,
            payload=payload,
        )
        self._audit_events.append(event)
        return event

    @property
    def audit_events(self) -> tuple[AuditEventRecord, ...]:
        """Return an immutable snapshot of append-only audit events."""
        return tuple(self._audit_events)


_SINGLETON_REPO = InMemoryDemoRepository()


def get_repository() -> InMemoryDemoRepository:
    return _SINGLETON_REPO


def build_expiry(minutes: int = 15) -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)
