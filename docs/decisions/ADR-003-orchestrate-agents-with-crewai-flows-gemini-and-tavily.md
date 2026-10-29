# ADR-003: Orchestrate Mzansi Agent Fleet with CrewAI Flows, Gemini 3.8 Flash, and Tavily

**Date:** 2026-10-29  
**Status:** `Accepted`  
**Deciders:** Senior Engineering Lead  
**Layer:** `Experience`  
**FinOps Impact:** `$0 – $8/mo` (`gemini-3.8-flash` capped at `$10/mo`; Tavily Free Tier `1,000` credits/mo = `$0`; Cloud Run scale-to-zero = `$0`)  
**Related ADRs:** [ADR-002](ADR-002-adopt-copilotkit-react-native-headless-and-ag-ui.md), [ADR-005](ADR-005-enforce-biometric-hitl-and-twenty-dollar-finops-cap.md)  
**Related TDD/HLD:** [`docs/architecture/integration-architecture.md`](../architecture/integration-architecture.md), [`docs/architecture/agentic-demo-hld.md`](../architecture/agentic-demo-hld.md)

---

## Context

Sahara Mzansi requires multi-skill intelligence across three domains shown in the Stitch designs:
1. **Jabu (Treasury, Payments & Wealth Coach):** Recipient/PayShap resolution, safe-float checks, yield stash sweeps, and wealth projections.
2. **Kagiso (Fee Defense & DebiCheck Sentinel):** Recurring debit-order inspection and fee leakage alerts.
3. **Thabo (Utility & Envelope Arbiter):** Prepaid electricity/data tracking and monthly category quota checks.

In addition, financial literacy coaching must never hallucinate South African rates, tax-free savings thresholds, or SARB/FSCA rules. Pairing **CrewAI Flows (`Flow[SaharaAgentState]` extending `CopilotKitState`)** with **CopilotKit's FastAPI integration (`CopilotKitRemoteEndpoint` + `copilotkit_emit_state`)**, **Google Gemini 3.8 Flash (`gemini-3.8-flash` via `google-genai`, replacing deprecated `gemini-2.5-*` models)**, and **Tavily Search API** solves stateful multi-agent orchestration, live mobile progress telemetry, and real-time web grounding at near-zero cost.

## Decision Drivers

- Stream structured agent progress (`logs`, `canvas_logs`) and staged proposals (`staged_transfer`) directly into the Android app via AG-UI.
- Ground South African financial literacy answers in real, current sources (`resbank.co.za`, `fsca.co.za`, `sars.gov.za`, `gov.za`) rather than stale LLM weights.
- Keep backend compute and LLM spend strictly inside the `$20/month` ceiling.

## Decision

> **We will implement the Experience-layer agent backend in Python FastAPI using CrewAI Flows (`Flow[SaharaAgentState]` extending `CopilotKitState`) bridged via `@copilotkit/runtime/v2`, powered by Google Gemini 3.8 Flash (`gemini-3.8-flash`) for reasoning and Tavily Search API + Supabase `pgvector` for grounded financial literacy.**

## Options Considered

### Option A: CrewAI Flows (`CopilotKitState`) + FastAPI + Gemini 3.8 Flash + Tavily — CHOSEN
- **Pros:** Deterministic event-driven `Flow` steps around AI tasks; native `copilotkit_emit_state` streaming to `@copilotkit/react-native/headless`; Tavily `include_domains` prevents ungrounded financial claims; unifies agent backend and FastAPI `/v1/*` Process services in Python 3.12.
- **Cons:** Requires a thin `@copilotkit/runtime/v2` Node listener (`/api/copilotkit`) in front of FastAPI `/copilotkit` (packaged cleanly via Docker Compose / Cloud Run).

### Option B: Multi-Language `.NET` + `Go` + `Node` Microservices — REJECTED
- **Reason:** Massive polyglot complexity with weak CrewAI/CopilotKit ecosystem support.

### Option C: Local LLM on Developer Laptop (Ollama) — REJECTED
- **Reason:** Unreliable multi-step tool calling on small quantised models, poor battery/thermal performance, and unreachable when the laptop sleeps.

## Consequences

- **Positive:** Eliminates the abandoned `.NET` / `Go` microservice stubs; gives every agent action real-time UI transparency and citation-backed SA financial literacy.
- **Compliance:** Tavily queries are strictly sanitised (zero customer PII sent to search queries) and restricted to authoritative financial/regulatory domains.

## Y-Statement Summary

> In the context of **building Sahara Mzansi's multi-domain banking copilot and financial literacy coach**, facing **hallucination risks and a `$20/mo` budget**, we decided for **CrewAI Flows (`CopilotKitState`) + Gemini 3.8 Flash + Tavily + `pgvector`** to achieve **transparent multi-agent workflows and fact-grounded SA literacy**, accepting **a Python FastAPI + thin Node runtime pairing**, because **it delivers first-class AG-UI state streaming and web grounding on free/scale-to-zero tiers**.
