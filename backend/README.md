# Sahara Mzansi — Agentic & Banking Backend (`backend/`)

The unified backend workspace for **Sahara Mzansi**, cleanly separating the **Experience Layer** (AG-UI gateway + CrewAI multi-agent orchestration) from the **Process & System Layers** (deterministic FastAPI banking domain services, Two-Phase Biometric HITL gate, integer-cent Postgres ledger, and SA rail adapters).

- **Architecture:** [Integration Architecture](../docs/architecture/integration-architecture.md) · [High-Level Design](../docs/architecture/agentic-demo-hld.md)
- **Governing ADRs:** [ADR-003 (CrewAI Flows, Gemini & Tavily)](../docs/decisions/ADR-003-orchestrate-agents-with-crewai-flows-gemini-and-tavily.md) · [ADR-004 (Supabase Postgres Ledger & Auth)](../docs/decisions/ADR-004-use-supabase-postgres-ledger-and-auth.md) · [ADR-005 (Biometric HITL & FinOps Cap)](../docs/decisions/ADR-005-enforce-biometric-hitl-and-twenty-dollar-finops-cap.md)

---

## 1. Two-Process Runtime Topology

| Service | Runtime & Port | Layer | Responsibility |
|---|---|---|---|
| `copilot-runtime/` | Node.js 22 · TypeScript (`:8200`) | **Experience (AG-UI Edge)** | Self-hosted `@copilotkit/runtime/v2` (`/api/copilotkit`). Verifies Supabase Bearer JWTs, enforces per-user daily message caps (`50 turns/day`), and bridges AG-UI streams to FastAPI via `CopilotKitRemoteEndpoint`. |
| `app/` | Python 3.12 · FastAPI (`:8000`) | **Experience (`agents/`) + Process (`process/`) + System (`system/`)** | Hosts CrewAI `Flow[SaharaAgentState]` on `/copilotkit` (`copilotkit.crewai`) **and** deterministic banking REST endpoints on `/v1/*` backed by Supabase Postgres (`BIGINT` cents). |

> **Architectural Invariant:** CrewAI agents in `app/agents/` **never** hold direct database write credentials or ledger-mutating tools. Agents can read portfolio context, search grounded SA financial literacy sources, and stage `PENDING_APPROVAL` proposals. Only a human-signed Android `BiometricPrompt` confirmation to `POST /v1/approvals/{id}/confirm` (with `X-Idempotency-Key`) commits a ledger transaction.

---

## 2. CrewAI Flows, Gemini 2.5 Flash & Tavily Grounding

Adapted from the CopilotKit + CrewAI + Tavily full-stack pattern ([ADR-003](../docs/decisions/ADR-003-orchestrate-agents-with-crewai-flows-gemini-and-tavily.md)):

1. **Shared Typed Agent State (`SaharaAgentState(CopilotKitState)`):**
   - Tracks `logs` (live status pills streamed to Android via `await copilotkit_emit_state(self.state)`), `safe_float_zar_cents`, `staged_approval`, and `literacy_cards`.
2. **Mzansi Specialist Crew:**
   - **Jabu (Wealth & Treasury Coach):** Recipient/ShapID resolution, PayShap (`R0`) vs Instant EFT (`R50`) fee comparison, idle-float Notice Stash (`8.25% APY`) sweeps, and compound-vs-inflation simulations.
   - **Kagiso (Fee & Debit-Order Sentinel):** DebiCheck / recurring subscription anomaly detection and staged debit-order blocks.
   - **Thabo (Smart Utility & Budget Arbiter):** Prepaid electricity/airtime burn-rate tracking and category budget quota checks.
3. **Zero-Hallucination SA Financial Literacy:**
   - **Tier 1:** Curated South African financial literacy embeddings in **Supabase `pgvector`** (compound interest, TFSA annual/lifetime caps, PayShap rules, emergency fund sizing, POPIA/FAIS educational disclaimers).
   - **Tier 2:** Domain-restricted **Tavily Search API** (`include_domains=["resbank.co.za", "fsca.co.za", "sars.gov.za", "gov.za", "banking.org.za"]`, Free Tier `1,000 credits/mo = $0/mo`) with 24-hour Postgres result caching.

---

## 3. Planned Directory Structure (Phase 2 Scaffold)

```text
backend/
├── docker-compose.yml            # Local dev stack (:8200 copilot-runtime + :8000 fastapi)
├── .env.example                  # Required env vars (never commit real secrets)
├── copilot-runtime/              # Node 22 @copilotkit/runtime/v2 AG-UI gateway
│   ├── package.json
│   └── src/server.ts             # JWT verification + rate limit + CopilotRuntime bridge
├── app/                          # Python 3.12 FastAPI + CrewAI Flows
│   ├── main.py                   # Mounts /copilotkit (add_fastapi_endpoint) + /v1/* routers
│   ├── agents/                   # Experience Layer: SaharaFlow, Jabu, Kagiso, Thabo, Tavily tool
│   ├── process/                  # Process Layer: FICA, ledger, safe-float, HITL approvals, rules
│   └── system/                   # System Layer: Supabase repo, audit writer, CDM-Lite adapters
├── supabase/
│   ├── migrations/               # BIGINT cent ledger, RLS policies, append-only audit_events
│   └── seed.sql                  # Demo personas, beneficiaries, vaults & literacy vectors
└── tests/                        # Pytest suite: ledger math, SA ID Luhn, idempotency, HITL gate
```

---

## 4. Required Environment Variables (`.env.example`)

| Variable | Scope | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | `app/` | Google Gemini 2.5 Flash LLM calls (protected by `$10/mo` GCP hard budget cap) |
| `TAVILY_API_KEY` | `app/` | Domain-restricted SA financial literacy search (`1,000` free credits/mo) |
| `SUPABASE_URL` | `copilot-runtime/`, `app/` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `copilot-runtime/`, `mobile/` | Public anon key for JWT verification & RLS-scoped reads |
| `SUPABASE_SERVICE_ROLE_KEY` | `app/process/` only | Server-only transactional ledger & `audit_events` writer (never exposed to `mobile/` or LLM prompts) |
| `FASTAPI_AGENT_URL` | `copilot-runtime/` | Internal URL of FastAPI `/copilotkit` endpoint (`http://localhost:8000/copilotkit`) |

---

## 5. Cloud Deployment (`<= $20/Month` FinOps Guardrail)

Both containers deploy to **Google Cloud Run** (`min-instances = 0`, scaling to zero when idle so compute costs **`$0.00/month`** within Cloud Run's free tier) behind **Cloudflare Edge** (`~$1/month` domain).
