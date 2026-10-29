# Sahara Mzansi — The Agentic Engineering Lead Reference

**A clean-room reference standard and Android banking super-app blueprint demonstrating how the Engineering Lead function operates when AI agents, native Generative UI, and executable governance become the default — built to run under a strict `<= $20/month` FinOps ceiling.**

The Engineering Lead (EL) role is being reshaped. Architecture is moving from static slides that drift to **rules an agent carries and enforces at authoring time**. Governance is moving from wiki pages nobody reads to **executable instructions, ADRs, and CI checks**. And banking products themselves are becoming **agentic** — systems where specialist agents educate users on wealth, synthesize transfers, and stage bounded automations while **pausing at a hardware-backed biometric Human-in-the-Loop (HITL) gate before a single cent moves**.

This repository delivers both halves together through **Sahara Mzansi**: an **Android-only** South African agentic banking and wealth super app covering FICA registration, consolidated wealth vaults, grounded financial literacy, PayShap transfers, and biometric HITL settlement.

---

## The thesis — what changes for the Engineering Lead

| Yesterday | In this standard |
|---|---|
| Architecture lives in diagrams that go stale | Architecture is **encoded in specialist agents** ([`senior-engineering-lead`](.github/agents/senior-engineering-lead.agent.md), [`mobile-architect`](.github/agents/mobile-architect.agent.md)) that enforce layer boundaries, FinOps caps, and HITL security chains on every change |
| Standards are PDFs in a wiki | Standards are **executable instructions, templates, and CI workflows** ([`.github/`](.github/)) that travel with the code |
| Decisions are tribal knowledge | Decisions are **indexed ADRs** ([`ADR-001`–`ADR-005`](docs/decisions/ADR-000-index.md)), explicitly recording trade-offs and cost ceilings |
| Enterprise reference stacks require `$20,000/mo` | Regulated banking discipline (`Channel → Experience → Process → System`, integer-cent double-entry ledger, idempotency, append-only audit logs) runs cleanly for **`~$1–$9/month`** |
| Agents either only chat or unsafely mutate state | Agents stream native Generative UI over **AG-UI** and stage `PENDING_APPROVAL` intents that **require Android `BiometricPrompt` confirmation** |

---

## What this repository provides

| Component | What it gives you |
|---|---|
| **8-Screen Sahara Mzansi Product & UI Spec** | [`docs/designs/sahara-mzansi/`](docs/designs/sahara-mzansi/README.md) — end-to-end Stitch mobile screens covering Onboarding/FICA (Screens 1–3), Consolidated Wealth Dashboard (Screen 4), and Agentic Copilot + Biometric HITL Settlement (Screens 5–8). |
| **Android-Only Native Channel (`mobile/`)** | [`mobile/README.md`](mobile/README.md) — React Native (Expo) + `@copilotkit/react-native/headless` over AG-UI, Hermes line-1 CSPRNG polyfill enforcement, versioned native GenUI component catalogue, and `expo-local-authentication` `BiometricPrompt` clearance. |
| **Multi-Agent & Ledger Backend (`backend/`)** | [`backend/README.md`](backend/README.md) — self-hosted `@copilotkit/runtime/v2` gateway + FastAPI + **CrewAI Flows** (`CopilotKitState` streaming *Jabu*, *Kagiso*, and *Thabo*), **Gemini 2.5 Flash**, **Tavily** grounded SA financial literacy, and **Supabase Postgres** (`BIGINT` cent ledger + RLS). |
| **Encoded Architecture & Guardrails** | [`.github/agents/`](.github/agents/) and [`.github/instructions/`](.github/instructions/) — enforcing POPIA, PCI-DSS (zero raw PANs), NCA/FAIS educational framing, integer-cent math, and strict `<= $20/mo` FinOps limits. |
| **Executable Governance & Playbook** | [`docs/decisions/`](docs/decisions/ADR-000-index.md) (5 Accepted ADRs), [`docs/playbook/`](docs/playbook/README.md), 12 sanitized [artifact templates](.github/templates/), and automated [GitHub Actions CI](.github/workflows/ci.yml). |

---

## Start here — reading order

1. **[Step-by-Step Developer Implementation Guide (Phases 2 to 5)](docs/developer-implementation-guide.md)** — plain-English instructions to run Phase 2 locally and implement Phases 3, 4, and 5 end to end.
2. **[High-Level Design (`<= $20/Month` Stack)](docs/architecture/agentic-demo-hld.md)** — the end-to-end 4-layer architecture (`Channel → Experience → Process → System`) and itemized `~$1–$9/mo` FinOps budget.
3. **[Sahara Mzansi Stitch Screen Specification](docs/designs/sahara-mzansi/README.md)** — all 8 mobile screens mapped to registration, wealth landing dashboard, literacy coaching, and biometric HITL settlement.
4. **[Architecture Decision Records (`ADR-001`–`ADR-005`)](docs/decisions/ADR-000-index.md)** — why Web/PWA, iOS, and enterprise brokers were descoped in favor of Android Expo, `@copilotkit/react-native/headless`, CrewAI Flows + Tavily, and Supabase.
5. **[Frontend Architecture](docs/architecture/frontend-architecture.md) & [Integration Architecture](docs/architecture/integration-architecture.md)** — deep dives into the Hermes CSPRNG polyfill order, `/headless` Metro rule, AG-UI streaming, Two-Phase Biometric HITL gate, and CDM-Lite rail adapters.
6. **[Senior Engineering Lead Agent](.github/agents/senior-engineering-lead.agent.md) & [EL Playbook](docs/playbook/README.md)** — how delivery, compliance, and lifecycle gates operate.

---

## Status & roadmap

Stated plainly — a standard that overstates itself earns no trust.

| Workstream | Location | Current Status |
|---|---|---|
| **Clean-Room Architecture, Governance & ADRs** | [`.github/`](.github/), [`docs/decisions/`](docs/decisions/ADR-000-index.md), [`docs/architecture/`](docs/architecture/agentic-demo-hld.md) | **Complete (Phase 1)** — legacy bloat, web store, and multi-language stubs removed; 5 ADRs & CI guardrails active |
| **8-Screen Mobile UI/UX Specification** | [`docs/designs/sahara-mzansi/`](docs/designs/sahara-mzansi/README.md) | **Complete** — Stitch screens & component mappings locked |
| **Foundation Scaffolds & Ledger Schema** | [`mobile/`](mobile/README.md), [`backend/`](backend/README.md), [`docs/developer-implementation-guide.md`](docs/developer-implementation-guide.md) | **Complete (Phase 2)** — Supabase `BIGINT` ledger SQL, FastAPI Process + Two-Phase HITL engine, CopilotKit `:8200` gateway, and Android Expo Router + `/headless` GenUI shell scaffolded & tested |
| **Full Screens 1–8 UI, Live CrewAI Flows & Cloud Run APK** | [`docs/developer-implementation-guide.md`](docs/developer-implementation-guide.md) | **Phases 3–5 Next** — step-by-step developer instructions ready to execute |

---

## Repository map

```text
engineering-lead/
├── README.md                         ← Thesis, architecture overview, and reading order
├── mobile/                           ← Android-only Expo + @copilotkit/react-native/headless channel
│   └── README.md                       Hermes CSPRNG rule, headless GenUI catalogue & BiometricPrompt spec
├── backend/                          ← CopilotKit Runtime v2 + FastAPI + CrewAI Flows + Tavily + Supabase
│   └── README.md                       Two-process runtime topology, env vars & Two-Phase HITL contract
├── docs/
│   ├── architecture/                 ← HLD, Frontend Architecture, Integration Architecture & Draw.io diagrams
│   ├── decisions/                    ← ADR-000 index + ADR-001 through ADR-005
│   ├── designs/sahara-mzansi/        ← 8 Stitch mobile screens + product-to-architecture mapping
│   └── playbook/                     ← Lean Engineering Lead operating playbook (roles, gates, FinOps, checklists)
└── .github/
    ├── agents/                       ← Encoded architecture: senior-engineering-lead & mobile-architect
    ├── instructions/                 ← Authoring-time architecture & SA banking compliance rules
    ├── templates/                    ← 12 clean-room EL artifact templates (ADR, HLD, LLD, TDD, OpenAPI, etc.)
    ├── workflows/ci.yml              ← Automated governance, clean-room hygiene & build checks
    └── copilot-instructions.md       ← Repo-wide Sahara Mzansi guardrails
```

---

## Maintainer & licence

Maintained by **Letlhogonolo Obonye** ([@obonyel](https://github.com/obonyel)) and **Theodore Obonye** ([@thatguycodes](https://github.com/thatguycodes)).

Released under the **[Apache License 2.0](LICENSE)** — you are free to use, adapt, and build on this reference standard in your own organisation, including commercially, provided you retain the attribution and licence notices. Contributions and adaptations are welcome; please keep this repository credited as the origin.

---

*A reference for agentic application engineering and the Engineering Lead function in a regulated context. All banking accounts, FICA checks, virtual cards, and PayShap rails are simulated; no real customer data, credentials, or payments are processed.*
