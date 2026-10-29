---
applyTo: "**/*.md,**/*.yaml,**/*.yml,**/*.json,**/*.ts,**/*.tsx,**/*.py,**/*.sql"
---

# Architecture Standards — Sahara Mzansi

## 1. Layer Discipline

Code and configuration must respect strict separation across Channel, Experience, Process, and System boundaries:

- **Channel (`mobile/` — Android Expo / React Native):**
  - **Contains:** Native screens, `@copilotkit/react-native/headless` provider and hooks (`useRenderTool`, `useFrontendTool`), versioned native Generative UI components, Android `BiometricPrompt` step-up UI, and session token storage (`expo-secure-store`).
  - **Must NOT contain:** LLM API keys, Supabase `service_role` keys, ledger math, or direct database writes.

- **Experience Layer (`backend/copilot-runtime/` & `backend/app/agents/`):**
  - **Contains:** Self-hosted `@copilotkit/runtime/v2` AG-UI endpoint (`/api/copilotkit`), CrewAI `Flow[SaharaAgentState]` (`CopilotKitState`) orchestrating *Jabu*, *Kagiso*, and *Thabo*, `copilotkit_emit_state` progress telemetry, and Tavily grounded financial literacy retrieval.
  - **Must NOT contain:** Direct ledger mutations, floating-point fee/balance math, or bypasses around the Process layer's HITL approval gate.

- **Process Layer (`backend/app/process/`):**
  - **Contains:** FastAPI `/v1/*` domain services (onboarding, accounts, vaults, staged approvals, payment execution, recurring automation rules), 6-step authorization chain enforcement, `X-Idempotency-Key` deduplication, safe-float checks, and atomic Postgres transactions.
  - **Must NOT contain:** React Native UI layout details or raw provider-specific wire formats.

- **System Layer (`backend/app/system/` & `Supabase`):**
  - **Contains:** Supabase Postgres (`BIGINT` cent double-entry ledger, RLS policies, append-only `audit_events`, `pgvector`, `pg_cron`), Supabase Auth, and thin Canonical Data Model (CDM-lite) adapters (`PayShapSimAdapter`, `FicaValidatorAdapter`, `UtilitySimAdapter`).
  - **Must NOT contain:** Multi-step workflow orchestration or channel presentation logic.

## 2. Canonical Data Model (CDM-Lite)

All data crossing Process $\leftrightarrow$ System adapters uses clean Pydantic / Zod canonical models:
- Monetary fields use `{ amount_cents: int, currency: "ZAR" | "USD" | "EUR" | "GBP" }`.
- External or simulated banking rails (PayShap, EFT RTC, FICA, prepaid utilities) sit behind single-responsibility adapter interfaces so live partner APIs can replace simulated adapters later without changing Process or Experience code.

## 3. API & Streaming Design Standards

- **Agent Transport:** AG-UI over HTTP streaming (`/api/copilotkit` $\rightarrow$ FastAPI `/copilotkit`) with `CopilotKitState` delta emissions (`copilotkit_emit_state`) for real-time agent reasoning steps.
- **REST Process APIs:** Versioned at `/v1/` with spec-first OpenAPI 3.1 contracts (`.github/templates/api-contract-template.yaml`).
- **Authentication:** Supabase OAuth 2.0 / JWT Bearer verification on every `/api/copilotkit` and `/v1/*` request. Unauthenticated LLM or Process endpoints are forbidden.
- **Idempotency:** `X-Idempotency-Key: <uuid-v4>` is mandatory on all `POST` / `PATCH` state-mutating endpoints.
- **Errors:** All REST errors conform to RFC 9457 Problem Details (`type`, `title`, `status`, `detail`, `instance`, `correlationId`, `errorCode`) so both the mobile app and CrewAI agents can explain failures deterministically.

## 4. Transactional Integrity & Failure Compensation

- **Single-Database ACID First:** Because the entire ledger lives in Supabase Postgres, multi-step financial mutations (debit main account $\rightarrow$ credit vault/recipient $\rightarrow$ update budget envelope $\rightarrow$ mark approval `EXECUTED` $\rightarrow$ insert `audit_events`) execute inside a **single atomic Postgres transaction** (`SELECT ... FOR UPDATE`), avoiding distributed Kafka/saga complexity.
- **Explicit Compensation:** Any multi-step flow crossing an external adapter declares its compensating action up front before implementation.

## 5. FinOps & ADR Governance

An Architecture Decision Record (ADR) in `docs/decisions/` (using `.github/templates/adr-template.md`) is required before:
- Introducing any external library, API, or cloud resource.
- Changing any rule that affects the **`<= $20/month` total operating budget**.
- Modifying the HITL approval gate, POPIA consent flow, or ledger schema.

## 6. Observability Standards

- Structured JSON logs on all backend services containing `timestamp`, `level`, `service`, `correlationId`, `userId` (pseudonymised), `operation`, `durationMs`, and `outcome`.
- Never log raw national IDs, OTPs, session JWTs, or card numbers.
