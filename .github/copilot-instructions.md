# Copilot Instructions — Sahara Mzansi Agentic Banking Super App

## Repository Purpose

This repository contains the executable governance, architecture decision records, Stitch UI specifications, and implementation workspace for **Sahara Mzansi** — an Android-first agentic banking and wealth super app built on a strict `<= $20/month` FinOps ceiling.

The system spans one focused client channel and three strictly separated backend/data layers:
- **Channel:** Android Mobile App (`mobile/` — React Native via Expo + `@copilotkit/react-native/headless` over AG-UI). Web and iOS are explicitly out of scope.
- **Experience Layer:** CopilotKit Runtime v2 (`/api/copilotkit`) + CrewAI Flows (`Flow[CopilotKitState]`) orchestrating the Mzansi Agent Fleet (*Jabu*, *Kagiso*, *Thabo*) with Gemini 2.5 Flash and Tavily grounded financial literacy search.
- **Process Layer:** FastAPI domain services (`backend/app/process/`) owning FICA onboarding, double-entry integer-cent ledger transfers, safe-float and budget guardrails, bounded payment automation, `X-Idempotency-Key` deduplication, and the two-phase Human-in-the-Loop (HITL) clearance gate.
- **System Layer:** Supabase (`Postgres` + `Supabase Auth` + `Row-Level Security` + `pgvector` + `pg_cron`) and thin Canonical Data Model (CDM-lite) rail adapters (`PayShap`, `FICA`, `Utilities`).

## Engineering Agents

- Use `@senior-engineering-lead` for architecture reviews, ADRs, HLDs, TDDs, LLDs, NFRs, runbooks, risk registers, security reviews, and FinOps validation.
- Use `@mobile-architect` for Android React Native / Expo architecture, `@copilotkit/react-native/headless` integration, Hermes polyfills, native Generative UI component catalogues, Android `BiometricPrompt` step-up, and EAS / Firebase App Distribution delivery.

## Non-Negotiable Architecture Principles

1. **Strict Layer Separation:** Experience = channel adaptation, AG-UI streaming, and agent proposals (zero business math or direct ledger writes). Process = domain validation, HITL verification, idempotency, and double-entry ledger logic. System = Supabase persistence and thin CDM-lite rail adapters.
2. **Two-Phase Human-in-the-Loop (HITL) Money Gate:** No LLM or CrewAI agent has a tool that executes a transfer, blocks a debit order, or mutates balances directly. Agents may only **stage** a `PENDING_APPROVAL` proposal (`stagePayment`, `proposeVaultSweep`, `stageDebitOrderBlock`). Execution requires an explicit, biometric-authenticated user confirmation call to the Process layer.
3. **Grounded Financial Literacy (No Hallucinated Facts):** Interest rates, inflation figures, SARB/FSCA rules, tax-free savings limits, and fee comparisons must come from curated `pgvector` content or domain-restricted Tavily searches (`resbank.co.za`, `fsca.co.za`, `sars.gov.za`, `gov.za`). Frame all wealth guidance as educational simulations, never unlicensed FAIS investment advice.
4. **Integer-Cent Accounting:** All monetary values are stored and calculated in integer cents (`BIGINT`, e.g., `R1,500.00` = `150000`). Floating-point currency math is forbidden.
5. **Idempotent & Audited Writes:** Every state-changing Process endpoint requires `X-Idempotency-Key` (UUID v4) and writes an append-only record to `audit_events`.
6. **Hard `<= $20/month` FinOps Ceiling:** Every architectural or dependency proposal must stay within free/scale-to-zero tiers (Google Cloud Run, Supabase Free, Tavily Free, Gemini Flash with a `$10/mo` hard billing cap, Cloudflare Free + custom domain, Firebase App Distribution). New paid SaaS or enterprise middleware is rejected unless approved via ADR under budget.

## Regulatory & Security Baseline (South Africa)

- **POPIA:** Capture explicit consent during onboarding before storing PII; enforce Supabase RLS on all user tables; never stream raw national IDs or full addresses to external LLM prompts.
- **PCI-DSS Scope Avoidance:** Never capture, log, or store raw 16-digit card PANs or CVVs. Virtual cards store masked display metadata (`last4`, `expiryMonth`, `expiryYear`, `tokenRef`) only.
- **FICA (Simulated):** Validate 13-digit SA ID checksums (Luhn) deterministically in the Process layer during onboarding before activating simulated accounts.

## Governance & Artifacts

- Playbook: `docs/playbook/README.md`
- Architecture pillars & HLD: `docs/architecture/`
- UI/UX Stitch reference screens: `docs/designs/sahara-mzansi/`
- Architecture Decision Records: `docs/decisions/ADR-000-index.md`
- Reusable templates: `.github/templates/`
