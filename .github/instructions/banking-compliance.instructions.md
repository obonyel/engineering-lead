---
applyTo: "**/*.ts,**/*.tsx,**/*.py,**/*.sql"
---

# Banking Compliance & Agentic Safety Guardrails

## 1. PCI-DSS Scope Avoidance (Card Data Security)

- **NEVER** generate UI inputs, state stores, logs, or database columns that capture, transmit, or store raw 16-digit PANs (Primary Account Numbers), CVVs/CVCs, or full PINs.
- Sahara Mzansi demo virtual cards store only tokenized display metadata (`card_token`, `last4`, `brand`, `expiry_month`, `expiry_year`, `is_frozen`).

## 2. POPIA (Protection of Personal Information Act — South Africa)

- Record explicit `popia_consents` (purpose, version, timestamp) before storing user identity or financial profile data.
- Minimize prompt context: **never** inject raw 13-digit SA ID numbers, physical home addresses, or auth tokens into LLM/CrewAI system prompts or Tavily search queries. Pass masked/display identifiers (`"Nandi Rostova"`, `"nandi@capitec.shap"`, `last4`) to agents.
- Enforce Row-Level Security (`ENABLE ROW LEVEL SECURITY`) on every user-scoped table in Supabase Postgres, tested for cross-user isolation.

## 3. South African Financial Regulation (FICA / FAIS / FSCA)

- **FICA Onboarding:** Perform deterministic 13-digit SA ID Luhn validation and status verification in the Process layer before transitioning an account to `ACTIVE`.
- **FAIS Educational Boundary:** Sahara Mzansi is an unlicensed sandbox/demo super app. Agents (*Jabu*, *Kagiso*, *Thabo*) provide **financial literacy education, fee transparency, and user-directed cash-flow simulations**, never personalized regulated securities or credit advice. Include clear educational disclaimers on wealth projection cards.
- **Retrieval Grounding:** Financial rates, tax-free savings limits, inflation figures, and PayShap rules surfaced by agents must be grounded in verified Supabase `pgvector` knowledge entries or domain-restricted Tavily searches — never fabricated from model weights.

## 4. Two-Phase Agentic & Biometric HITL Authorization

- LLM reasoning is **never** an authorization mechanism.
- Money-moving or mandate-changing actions (`stagePayment`, `proposeVaultSweep`, `stageDebitOrderBlock`, `createAutomationRule`) may only create a `PENDING_APPROVAL` record and trigger a native approval card on the Android client.
- Execution occurs **only** when the authenticated user approves on the Android device (stepping up via Android `BiometricPrompt` for transfers above the `R500` threshold or new mandates) and calls `/v1/approvals/{id}/confirm` with a valid `X-Idempotency-Key`.
- Recurring payment automations must specify a hard maximum amount, recipient lock, safe-float pre-check, and 1-tap user revocation at any time.

## 5. Immutable Ledger & Audit Trail

- Store all monetary balances and ledger entries as integer cents (`BIGINT`). Every transfer writes balanced debit/credit `ledger_entries` rows inside an ACID transaction.
- Every state-changing operation writes an append-only row to `audit_events` (`actor_id`, `actor_type` [`USER` | `AGENT_PROPOSED_USER_APPROVED` | `SYSTEM_RULE`], `action`, `resource_type`, `resource_id`, `before_hash`, `after_hash`, `correlation_id`, `created_at`).
- `UPDATE` and `DELETE` privileges on `audit_events` and posted `ledger_entries` must be revoked from application roles.

## 6. Secrets & Cost Protection

- Zero secrets in source code, `app.json`, or client bundles. Only the public `SUPABASE_ANON_KEY` may exist on the Android client; `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, and `TAVILY_API_KEY` remain strictly server-side.
- Enforce per-user rate limits on `/api/copilotkit` and Tavily tool calls so automated abuse or prompt loops cannot breach the `$20/month` budget ceiling.
