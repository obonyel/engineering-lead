# ADR-005: Enforce Two-Phase Biometric HITL Money Gate and Hard `$20/Month` FinOps Ceiling

**Date:** 2026-10-29  
**Status:** `Accepted`  
**Deciders:** Product Owner / Founder, Senior Engineering Lead  
**Layer:** `Cross-cutting`  
**FinOps Impact:** Caps total platform spend at `<= $20/mo` (`~$1 – $9/mo` expected)  
**Related ADRs:** [ADR-001](ADR-001-target-android-only-expo-channel.md), [ADR-003](ADR-003-orchestrate-agents-with-crewai-flows-gemini-and-tavily.md), [ADR-004](ADR-004-use-supabase-postgres-ledger-and-auth.md)  
**Related TDD/HLD:** [`docs/architecture/agentic-demo-hld.md`](../architecture/agentic-demo-hld.md), [`docs/architecture/integration-architecture.md`](../architecture/integration-architecture.md)

---

## Context

Two non-negotiable constraints define Sahara Mzansi:
1. **Agentic Financial Safety:** Probabilistic LLMs can misinterpret prompts or suffer prompt injection. An agent must help users automate tedious clicking, optimize yield, and schedule payments, **without ever being able to unilaterally move money**.
2. **Cost Sovereignty:** Total monthly infrastructure and AI spend must never exceed **`$20/month`**.

## Decision

> **We will enforce (1) an architectural split between agent staging (`POST /v1/approvals/stage` $\rightarrow$ `PENDING_APPROVAL`) and biometric human confirmation (`POST /v1/approvals/{id}/confirm` gated by Android `BiometricPrompt`), and (2) hard FinOps billing caps (`$10/mo` Gemini API budget cap + per-user daily message/search quotas + scale-to-zero containers) keeping total monthly spend below `$20/month`.**

## Key Controls

1. **Structural Tool Isolation:** CrewAI agents do not possess credentials or functions to execute ledger transfers. Their tools (`stagePayment`, `proposeVaultSweep`, `stageDebitOrderBlock`, `createAutomationRule`) write `PENDING_APPROVAL` rows and pause the CrewAI Flow (`copilotkit_emit_state`) while the Android app displays Screen 7 (`BiometricClearanceGate`).
2. **Hardware Biometric Confirmation:** Tapping **Authorize & Dispatch** invokes Android `BiometricPrompt` (`expo-local-authentication`). Only after local biometric verification succeeds does the Android client call `/v1/approvals/{id}/confirm` with the user's Supabase JWT and `X-Idempotency-Key`, resuming the CrewAI thread with `"Accepted"` (or `"Rejected"` on cancel).
3. **Bounded Recurring Automation:** Users may opt into recurring rules (e.g., *"R1,500 to Mom on the 25th"* up to a hard cap like `R2,000/mo`). Each scheduled trigger runs safe-float pre-checks first, enforces recipient/amount ceilings, emits a notification/clearance prompt if thresholds are exceeded, and remains 1-tap revocable at any time.
4. **Hard FinOps Guardrails:**
   - Google Cloud Run `min-instances = 0`, `max-instances = 2`.
   - Gemini API hard monthly cap at `$10/mo` + application rate limit (`50` agent turns/user/day).
   - Tavily Free Tier (`1,000` credits/mo, cached in Supabase `pgvector` for 24h so repeated literacy questions cost `0` credits).

## Consequences

- **Positive:** Eliminates unauthorized LLM money movement by construction (not merely by prompt instructions) and guarantees predictable `~$1–$9/mo` monthly operating costs.
- **Trade-offs:** Consequential actions always require one human biometric tap on the Android phone — an intentional UX trust feature shown in Stitch Screen 7.

## Y-Statement Summary

> In the context of **an AI-driven banking super app operating on a founder budget**, facing **LLM hallucination/injection risk and cloud cost creep**, we decided for **a two-phase biometric HITL gate plus hard API quotas and scale-to-zero hosting** to achieve **provable user control over money and `<= $20/month` spend**, accepting **one biometric confirmation tap per financial mutation**, because **safety and cost predictability must be enforced by system architecture rather than model obedience**.
