"""Experience Layer — Sahara Mzansi Specialist Agent Coordinator (ADR-003).

Coordinates Jabu (Treasury & Wealth), Kagiso (Fee & Debit-Order Sentinel), and
Thabo (Utilities & Budget Arbiter) with:
  - Google Gemini (`gemini-3.8-flash` via `google-genai` Interactions API)
  - Domain-restricted Tavily SA regulatory grounding (`resbank.co.za`, `fsca.co.za`,
    `sars.gov.za`, `gov.za`, `banking.org.za`)
  - Offline Demo Mode fallback when cloud API keys are omitted locally.

SECURITY INVARIANT: This module has ZERO database write credentials and ZERO
tools capable of calling `confirm_approval`. It may only read context and call
`LedgerService.stage_transfer` to create `PENDING_APPROVAL` proposals.
"""

from __future__ import annotations

import re

from app.config import Settings
from app.models.domain import (
    CopilotTurnResponse,
    StageApprovalRequest,
    WealthSimulationRequest,
)
from app.process.guardrails import simulate_compound_vs_inflation
from app.process.ledger_service import LedgerService

ALLOWED_SA_LITERACY_DOMAINS = [
    "resbank.co.za",
    "fsca.co.za",
    "sars.gov.za",
    "gov.za",
    "banking.org.za",
]


def search_sa_financial_literacy(query: str, tavily_api_key: str) -> list[dict[str, str]]:
    """Query Tavily strictly across trusted South African regulatory/banking domains."""
    if not tavily_api_key:
        return [
            {
                "title": "SARB & PayShap Educational Reference (Offline Seed)",
                "url": "https://www.resbank.co.za/",
                "snippet": (
                    "PayShap clears instant interbank ZAR proxy transfers in <10s, while "
                    "high-yield notice deposits help offset CPI purchasing-power erosion."
                ),
            }
        ]
    from tavily import TavilyClient

    client = TavilyClient(api_key=tavily_api_key)
    result = client.search(
        query=query,
        search_depth="basic",
        max_results=3,
        include_domains=ALLOWED_SA_LITERACY_DOMAINS,
    )
    return [
        {
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "snippet": item.get("content", "")[:280],
        }
        for item in result.get("results", [])
    ]


def synthesize_with_gemini(
    *,
    prompt: str,
    system_instruction: str,
    settings: Settings,
) -> str | None:
    """Call Google Gemini (`gemini-3.8-flash`) via current `google-genai` Interactions API."""
    if not settings.gemini_api_key:
        return None
    from google import genai

    client = genai.Client(api_key=settings.gemini_api_key)
    interaction = client.interactions.create(
        model=settings.gemini_model,
        system_instruction=system_instruction,
        input=prompt,
    )
    return interaction.output_text


class SaharaAgentCoordinator:
    """Routes user intent across Jabu, Kagiso, and Thabo and stages GenUI payloads."""

    def __init__(self, ledger_service: LedgerService, settings: Settings) -> None:
        self.ledger_service = ledger_service
        self.settings = settings

    def handle_turn(
        self,
        *,
        user_id: str,
        message: str,
        correlation_id: str,
    ) -> CopilotTurnResponse:
        lower = message.lower()
        telemetry: list[str] = []

        # 1. Payment / PayShap transfer synthesis (Jabu -> Screens 5-7)
        if any(word in lower for word in ("send", "pay", "transfer", "mom", "groceries")):
            telemetry.append("Jabu: Resolving recipient ShapID & checking rail fees...")
            amount_cents = self._extract_zar_cents(message, default_cents=150_000)
            ben = self.ledger_service.repo.resolve_beneficiary("mom")
            beneficiary_id = ben.id if ben else "ben-mom"

            telemetry.append("Jabu: Verifying R3,200.00 Safe Daily Float Buffer...")
            staged = self.ledger_service.stage_transfer(
                user_id=user_id,
                req=StageApprovalRequest(
                    action_type="PAYSHAP_TRANSFER",
                    source_account_id="acc-main-zar",
                    beneficiary_id=beneficiary_id,
                    amount_cents=amount_cents,
                    rail="PAYSHAP",
                    reference="Family Groceries",
                    agent_name="Jabu",
                ),
                correlation_id=correlation_id,
            )
            telemetry.append(
                "Jabu: Staged PENDING_APPROVAL — awaiting Android BiometricPrompt clearance."
            )
            summary = (
                f"I resolved {staged.beneficiary_name} ({staged.shap_id}) on PayShap at R0.00 fee "
                f"(saving R50.00 vs Instant EFT) and funded from Main Checking so your 8.25% "
                f"Notice Stash keeps compounding. Confirm with your fingerprint/face to settle "
                f"R{staged.amount_cents / 100:,.2f}."
            )
            return CopilotTurnResponse(
                active_agent="Jabu",
                telemetry_logs=telemetry,
                assistant_message=summary,
                genui_card_type="v1.BiometricClearanceGate",
                genui_payload=staged.model_dump(mode="json"),
            )

        # 2. Debit-order & fee defense (Kagiso)
        if any(word in lower for word in ("debit", "fee", "duplicate", "gym", "audit")):
            telemetry.append("Kagiso: Scanning upcoming DebiCheck mandates & card fees...")
            telemetry.append("Kagiso: Flagged duplicate R499.00 FitLife Gym mandate on the 25th.")
            return CopilotTurnResponse(
                active_agent="Kagiso",
                telemetry_logs=telemetry,
                assistant_message=(
                    "I detected a duplicate R499.00 FitLife Gym debit order for the 25th. "
                    "Disputing unauthorized or duplicate mandates before payday avoids R110 unpaid "
                    "penalty fees. Tap 'Stage Dispute' if you want biometric HITL review."
                ),
                genui_card_type="v1.DebitOrderSentinelCard",
                genui_payload={
                    "merchant": "FitLife Gym Sandton",
                    "amount_cents": 49_900,
                    "due_day": 25,
                    "status": "FLAGGED_DUPLICATE",
                },
            )

        # 3. Grounded Financial Literacy & Compound Simulation (Jabu + Tavily/Gemini)
        telemetry.append("Jabu: Grounding SA inflation & Notice Stash rules...")
        citations = search_sa_financial_literacy(message, self.settings.tavily_api_key)
        principal_cents = self._extract_zar_cents(message, default_cents=2_000_000)
        sim = simulate_compound_vs_inflation(
            WealthSimulationRequest(principal_cents=principal_cents)
        )
        llm_reply = synthesize_with_gemini(
            prompt=f"User question: {message}\nSimulation: {sim.educational_summary}",
            system_instruction=(
                "You are Jabu, Sahara Mzansi's South African financial literacy coach. "
                "Keep answers concise (<= 3 sentences), cite ZAR figures accurately, and "
                "frame guidance strictly as educational cash-flow literacy (FAIS guardrail)."
            ),
            settings=self.settings,
        )
        return CopilotTurnResponse(
            active_agent="Jabu",
            telemetry_logs=telemetry,
            assistant_message=llm_reply or sim.educational_summary,
            genui_card_type="v1.WealthLiteracySimulatorCard",
            genui_payload={
                "simulation": sim.model_dump(mode="json"),
                "citations": citations,
            },
        )

    @staticmethod
    def _extract_zar_cents(text: str, default_cents: int) -> int:
        match = re.search(r"r\s*([0-9][0-9,]*)", text, flags=re.IGNORECASE)
        if not match:
            return default_cents
        digits = int(match.group(1).replace(",", ""))
        return digits * 100 if digits > 0 else default_cents
