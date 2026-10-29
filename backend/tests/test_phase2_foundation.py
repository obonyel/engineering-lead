"""Phase 2 Verification Suite: FICA Luhn, Double-Entry Ledger, Idempotency & Biometric HITL."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.agents.sahara_flow import SaharaAgentCoordinator
from app.config import Settings
from app.main import app
from app.models.domain import (
    ConfirmApprovalRequest,
    FicaVerifyRequest,
    StageApprovalRequest,
    WealthSimulationRequest,
)
from app.process.fica import FicaValidationError, validate_fica_submission, verify_luhn_13
from app.process.guardrails import compare_payment_rails, simulate_compound_vs_inflation
from app.process.ledger_service import BankingRuleError, LedgerService
from app.system.repository import InMemoryDemoRepository


def make_valid_sa_id(prefix_12: str) -> str:
    """Compute the exact modulo-10 check digit for a 12-digit SA ID prefix."""
    for check in range(10):
        candidate = f"{prefix_12}{check}"
        if verify_luhn_13(candidate):
            return candidate
    raise RuntimeError("Unreachable")


def test_fica_validates_13_digit_sa_id_and_popia_consent() -> None:
    valid_id = make_valid_sa_id("920220472008")  # Born 1992-02-20, SA citizen (0)
    res = validate_fica_submission(
        FicaVerifyRequest(sa_id_number=valid_id, popia_consented=True),
        pepper="unit-test-pepper",
    )
    assert res.verified is True
    assert str(res.birth_date) == "1992-02-20"
    assert res.citizenship == "SA_CITIZEN"
    assert valid_id not in res.id_salted_hash

    with pytest.raises(FicaValidationError, match="POPIA"):
        validate_fica_submission(
            FicaVerifyRequest(sa_id_number=valid_id, popia_consented=False),
            pepper="unit-test-pepper",
        )

    bad_digit = "9" if valid_id[-1] != "9" else "8"
    with pytest.raises(FicaValidationError, match="checksum"):
        validate_fica_submission(
            FicaVerifyRequest(sa_id_number=valid_id[:-1] + bad_digit, popia_consented=True),
            pepper="unit-test-pepper",
        )


def test_agent_staging_never_mutates_balance_and_requires_biometric_hitl() -> None:
    repo = InMemoryDemoRepository()
    service = LedgerService(repo)
    coordinator = SaharaAgentCoordinator(service, Settings(demo_mode=True))

    initial_balance = repo.accounts["acc-main-zar"].balance_cents
    turn = coordinator.handle_turn(
        user_id="demo-user-elena",
        message="Send R1,500 to my mom for groceries via PayShap",
        correlation_id="corr-test-1",
    )

    assert turn.genui_card_type == "v1.BiometricClearanceGate"
    assert turn.genui_payload is not None
    approval_id = turn.genui_payload["approval_id"]

    # Architectural Law: Agent turn MUST NOT change ledger balance
    assert repo.accounts["acc-main-zar"].balance_cents == initial_balance

    # Confirming WITHOUT Android BiometricPrompt attestation MUST fail (403)
    with pytest.raises(BankingRuleError) as exc_info:
        service.confirm_approval(
            user_id="demo-user-elena",
            approval_id=approval_id,
            idempotency_key="idem-hitl-0001",
            req=ConfirmApprovalRequest(decision="APPROVE", biometric_attestation_id=None),
            correlation_id="corr-test-2",
        )
    assert exc_info.value.status_code == 403
    assert repo.accounts["acc-main-zar"].balance_cents == initial_balance


def test_biometric_confirm_is_double_entry_balanced_and_idempotent() -> None:
    repo = InMemoryDemoRepository()
    service = LedgerService(repo)
    initial_balance = repo.accounts["acc-main-zar"].balance_cents

    staged = service.stage_transfer(
        user_id="demo-user-elena",
        req=StageApprovalRequest(
            source_account_id="acc-main-zar",
            beneficiary_id="ben-mom",
            amount_cents=150_000,  # R1,500.00
            rail="PAYSHAP",
            reference="Monthly Groceries",
        ),
        correlation_id="corr-idem-1",
    )

    receipt_first = service.confirm_approval(
        user_id="demo-user-elena",
        approval_id=staged.approval_id,
        idempotency_key="idem-unique-998877",
        req=ConfirmApprovalRequest(
            decision="APPROVE",
            biometric_attestation_id="android_bioprompt_ok_01",
        ),
        correlation_id="corr-idem-2",
    )
    assert receipt_first.status == "SETTLED"
    assert repo.accounts["acc-main-zar"].balance_cents == initial_balance - 150_000

    debits = sum(e.amount_cents for e in receipt_first.entries if e.direction == "DEBIT")
    credits = sum(e.amount_cents for e in receipt_first.entries if e.direction == "CREDIT")
    assert debits == credits == 150_000

    # Replay with identical X-Idempotency-Key MUST NOT double-debit
    receipt_replay = service.confirm_approval(
        user_id="demo-user-elena",
        approval_id=staged.approval_id,
        idempotency_key="idem-unique-998877",
        req=ConfirmApprovalRequest(
            decision="APPROVE",
            biometric_attestation_id="android_bioprompt_ok_01",
        ),
        correlation_id="corr-idem-3",
    )
    assert receipt_replay.transaction_id == receipt_first.transaction_id
    assert repo.accounts["acc-main-zar"].balance_cents == initial_balance - 150_000


def test_rail_fee_and_compound_literacy_simulations_use_integer_cents() -> None:
    rails = compare_payment_rails("PAYSHAP")
    assert rails.payshap_fee_cents == 0
    assert rails.fee_saved_cents == 5000

    sim = simulate_compound_vs_inflation(
        WealthSimulationRequest(
            principal_cents=2_000_000, apy_bps=825, inflation_bps=500, months=12
        )
    )
    assert sim.yield_earned_cents > 0
    assert sim.purchasing_power_loss_cents > 0
    expected_advantage = sim.yield_earned_cents + sim.purchasing_power_loss_cents
    assert sim.net_wealth_advantage_cents == expected_advantage


def test_fastapi_endpoints_and_rfc9457_errors() -> None:
    client = TestClient(app)
    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["gemini_model"] == "gemini-3.8-flash"

    portfolio_res = client.get("/v1/portfolio")
    assert portfolio_res.status_code == 200
    assert portfolio_res.json()["total_net_worth_cents"] == 24_850_000  # R248,500.00 ZAR

    bad_stage = client.post(
        "/v1/approvals/stage",
        json={
            "source_account_id": "acc-does-not-exist",
            "amount_cents": 10000,
            "rail": "PAYSHAP",
            "reference": "Test",
        },
    )
    assert bad_stage.status_code == 404
    assert bad_stage.headers["content-type"].startswith("application/problem+json")
