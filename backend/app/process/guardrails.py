"""Process Layer — Deterministic Safe-Float, Rail Fee, and Compound Literacy Calculators."""

from __future__ import annotations

from app.models.domain import (
    RailComparison,
    SafeFloatAssessment,
    WealthSimulationRequest,
    WealthSimulationResponse,
)

PAYSHAP_FEE_CENTS = 0
EFT_RTC_FEE_CENTS = 5000  # R50.00 legacy instant EFT comparison


def compare_payment_rails(preferred_rail: str = "PAYSHAP") -> RailComparison:
    recommended = "PAYSHAP" if preferred_rail != "EFT_RTC" else "EFT_RTC"
    fee_saved = EFT_RTC_FEE_CENTS - PAYSHAP_FEE_CENTS if recommended == "PAYSHAP" else 0
    return RailComparison(
        recommended_rail=recommended,
        payshap_fee_cents=PAYSHAP_FEE_CENTS,
        eft_rtc_fee_cents=EFT_RTC_FEE_CENTS,
        fee_saved_cents=fee_saved,
        settlement_eta="< 10 seconds" if recommended == "PAYSHAP" else "Up to 60 minutes",
        literacy_explanation=(
            "PayShap settles in under 10 seconds at R0.00 fee — saving R50.00 vs legacy "
            "Instant EFT so that R50 stays compounding in your wealth stash."
        ),
    )


def evaluate_safe_float(
    balance_cents: int,
    debit_total_cents: int,
    safe_float_floor_cents: int,
) -> SafeFloatAssessment:
    balance_after = balance_cents - debit_total_cents
    surplus_after = balance_after - safe_float_floor_cents
    within_safe = balance_after >= safe_float_floor_cents
    warning: str | None = None
    if balance_after < 0:
        warning = "Insufficient available funds in Main Transact account."
    elif not within_safe:
        shortfall_rands = abs(surplus_after) / 100
        warning = (
            f"Heads-up: This transfer dips R{shortfall_rands:,.2f} into your "
            f"R{safe_float_floor_cents / 100:,.2f} Safe Daily Float Buffer."
        )
    return SafeFloatAssessment(
        within_safe_float=within_safe and balance_after >= 0,
        balance_before_cents=balance_cents,
        balance_after_cents=balance_after,
        safe_float_floor_cents=safe_float_floor_cents,
        surplus_after_cents=surplus_after,
        warning=warning,
    )


def simulate_compound_vs_inflation(req: WealthSimulationRequest) -> WealthSimulationResponse:
    """Integer-cent monthly compounding vs CPI purchasing-power erosion."""
    stash_cents = req.principal_cents
    purchasing_power_cents = req.principal_cents

    for _ in range(req.months):
        # Monthly yield in integer cents using round-half-up integer arithmetic
        monthly_yield = (stash_cents * req.apy_bps + 60_000) // 120_000
        stash_cents += monthly_yield

        monthly_erosion = (purchasing_power_cents * req.inflation_bps + 60_000) // 120_000
        purchasing_power_cents = max(0, purchasing_power_cents - monthly_erosion)

    yield_earned = stash_cents - req.principal_cents
    erosion_loss = req.principal_cents - purchasing_power_cents
    net_advantage = yield_earned + erosion_loss

    return WealthSimulationResponse(
        principal_cents=req.principal_cents,
        nominal_stash_end_cents=stash_cents,
        yield_earned_cents=yield_earned,
        checking_purchasing_power_cents=purchasing_power_cents,
        purchasing_power_loss_cents=erosion_loss,
        net_wealth_advantage_cents=net_advantage,
        educational_summary=(
            f"Over {req.months} months, sweeping R{req.principal_cents / 100:,.2f} into an "
            f"{req.apy_bps / 100:.2f}% APY Notice Stash earns +R{yield_earned / 100:,.2f}, "
            f"whereas leaving it at 0% during {req.inflation_bps / 100:.2f}% inflation erodes "
            f"R{erosion_loss / 100:,.2f} in real buying power."
        ),
        disclaimer=(
            "Educational financial literacy simulation only (FAIS guardrail). "
            "Simulated sandbox rates; not personalized regulated investment advice."
        ),
    )
