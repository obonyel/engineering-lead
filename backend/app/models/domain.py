"""Domain and API Pydantic models (integer cents only — zero float money)."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class ProblemDetails(BaseModel):
    """RFC 9457 Problem Details error envelope."""

    type: str = "about:blank"
    title: str
    status: int
    detail: str
    instance: str | None = None
    correlation_id: str | None = None


class FicaVerifyRequest(BaseModel):
    document_type: Literal["SMART_ID", "GREEN_BOOK", "PASSPORT"] = "SMART_ID"
    sa_id_number: str = Field(..., min_length=13, max_length=13)
    popia_consented: bool
    biometric_enrolled: bool = True


class FicaVerifyResponse(BaseModel):
    verified: bool
    fica_status: Literal["VERIFIED", "REJECTED"]
    birth_date: date
    citizenship: Literal["SA_CITIZEN", "PERMANENT_RESIDENT"]
    id_salted_hash: str
    educational_notice: str


class AccountSummary(BaseModel):
    id: str
    account_type: Literal["MAIN_TRANSACT", "NOTICE_STASH", "USD_VAULT"]
    name: str
    currency: str = "ZAR"
    balance_cents: int = Field(..., ge=0)
    apy_bps: int = Field(..., ge=0)
    status: Literal["ACTIVE", "FROZEN", "CLOSED"] = "ACTIVE"


class VirtualCardSummary(BaseModel):
    id: str
    account_id: str
    card_token: str
    last4: str = Field(..., min_length=4, max_length=4)
    brand: str = "VISA"
    frozen: bool = False
    daily_limit_cents: int = Field(..., ge=0)


class WealthVaultSummary(BaseModel):
    id: str
    name: str
    category: Literal["EMERGENCY", "PROPERTY", "TFSA", "CUSTOM"]
    target_cents: int = Field(..., gt=0)
    current_cents: int = Field(..., ge=0)
    apy_bps: int = Field(..., ge=0)
    notice_days: int = Field(..., ge=0)


class BeneficiarySummary(BaseModel):
    id: str
    display_name: str
    relationship: str
    shap_id: str | None = None
    bank_name: str
    account_masked: str
    preferred_rail: Literal["PAYSHAP", "EFT_RTC", "INTERNAL_SWEEP"] = "PAYSHAP"
    budget_category: str = "FAMILY_SUPPORT"
    monthly_budget_cents: int = Field(..., ge=0)
    monthly_spent_cents: int = Field(..., ge=0)


class AgentAlertCard(BaseModel):
    agent_name: Literal["Jabu", "Kagiso", "Thabo"]
    headline: str
    detail: str
    suggested_prompt: str
    potential_savings_cents: int = 0


class PortfolioSummaryResponse(BaseModel):
    user_id: str
    full_name: str
    shap_id: str
    total_net_worth_cents: int
    passive_yield_harvested_cents: int
    safe_float_zar_cents: int
    accounts: list[AccountSummary]
    virtual_cards: list[VirtualCardSummary]
    vaults: list[WealthVaultSummary]
    beneficiaries: list[BeneficiarySummary]
    agent_alerts: list[AgentAlertCard]


class RailComparison(BaseModel):
    recommended_rail: Literal["PAYSHAP", "EFT_RTC"]
    payshap_fee_cents: int = 0
    eft_rtc_fee_cents: int = 5000
    fee_saved_cents: int = 5000
    settlement_eta: str = "< 10 seconds"
    literacy_explanation: str


class SafeFloatAssessment(BaseModel):
    within_safe_float: bool
    balance_before_cents: int
    balance_after_cents: int
    safe_float_floor_cents: int
    surplus_after_cents: int
    warning: str | None = None


class StageApprovalRequest(BaseModel):
    action_type: Literal[
        "PAYSHAP_TRANSFER", "VAULT_SWEEP", "BLOCK_DEBIT_ORDER", "AUTOMATION_MANDATE"
    ] = "PAYSHAP_TRANSFER"
    source_account_id: str
    destination_account_id: str | None = None
    beneficiary_id: str | None = None
    amount_cents: int = Field(..., gt=0)
    rail: Literal["PAYSHAP", "EFT_RTC", "INTERNAL_SWEEP"] = "PAYSHAP"
    reference: str = Field(..., min_length=2, max_length=64)
    agent_name: Literal["Jabu", "Kagiso", "Thabo"] = "Jabu"


class StagedApprovalResponse(BaseModel):
    approval_id: str
    status: Literal["PENDING_APPROVAL", "APPROVED", "REJECTED", "EXPIRED"]
    action_type: str
    source_account_id: str
    beneficiary_name: str
    shap_id: str | None = None
    amount_cents: int
    fee_cents: int
    rail: str
    reference: str
    safe_float: SafeFloatAssessment
    rail_comparison: RailComparison
    expires_at: datetime


class ConfirmApprovalRequest(BaseModel):
    decision: Literal["APPROVE", "REJECT"] = "APPROVE"
    biometric_attestation_id: str | None = None


class LedgerEntryRecord(BaseModel):
    id: str
    transaction_id: str
    account_ref: str
    direction: Literal["DEBIT", "CREDIT"]
    amount_cents: int = Field(..., gt=0)


class SettlementReceiptResponse(BaseModel):
    transaction_id: str
    approval_id: str
    idempotency_key: str
    status: Literal["SETTLED", "REJECTED"]
    rail: str
    amount_cents: int
    fee_cents: int
    beneficiary_name: str
    shap_id: str | None = None
    reference: str
    new_account_balance_cents: int
    entries: list[LedgerEntryRecord]
    settled_at: datetime
    whatsapp_receipt_text: str


class WealthSimulationRequest(BaseModel):
    principal_cents: int = Field(..., gt=0)
    apy_bps: int = Field(default=825, ge=0, le=2500)
    inflation_bps: int = Field(default=500, ge=0, le=2500)
    months: int = Field(default=12, ge=1, le=120)


class WealthSimulationResponse(BaseModel):
    principal_cents: int
    nominal_stash_end_cents: int
    yield_earned_cents: int
    checking_purchasing_power_cents: int
    purchasing_power_loss_cents: int
    net_wealth_advantage_cents: int
    educational_summary: str
    disclaimer: str


class CopilotTurnRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class CopilotTurnResponse(BaseModel):
    active_agent: Literal["Jabu", "Kagiso", "Thabo"]
    telemetry_logs: list[str]
    assistant_message: str
    genui_card_type: str | None = None
    genui_payload: dict | None = None
