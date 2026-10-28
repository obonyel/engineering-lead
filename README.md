# The Agentic Engineering Lead

**A reference standard for how the Engineering Lead function operates when AI agents,
agentic applications, and executable governance become the default.**

The Engineering Lead (EL) role is being reshaped. Architecture is moving from documents
that drift to **rules an agent carries and applies consistently**. Governance is moving
from wiki pages nobody reads to **executable, machine-readable assets**. And the products
themselves are becoming **agentic** — systems where a language model reads application
state and takes actions on a user's behalf, which in a regulated domain raises the bar on
authorization, auditability, and human control.

This repository is a working reference for an EL function built for that shift. It is not
a template pack and not a theory deck — it is the artifacts themselves, wired together and
self-documenting, so any team can read a corner of it, understand *why* it is shaped the
way it is, and adopt the pattern in their own organisation.

The practice is demonstrated end-to-end through a **banking super-app reference
implementation** (three channels, an Experience/Process/System layer architecture,
tri-platform mobile, and an agentic commerce experience). The domain is illustrative:
swap banking for yours and the structure holds.

---

## The thesis — what changes for the Engineering Lead

| Yesterday | In this standard |
|---|---|
| Architecture lives in diagrams that go stale | Architecture is **encoded in an agent** that applies the stack's rules on every design — layers, sagas, CDM, the security chain |
| Standards are PDFs in a wiki | Standards are **executable instructions and templates** that travel with the code and shape the work as it happens |
| Decisions are tribal knowledge | Decisions are **ADRs**, linked to the designs they constrain, with trade-offs made explicit |
| "AI strategy" is a slide | AI is the **operating model**: the EL builds agentic products *and* leads with agentic tooling |
| The EL reviews after the fact | Guardrails are **present at authoring time** — compliance, layer discipline, and the agentic authorization chain are enforced where work is done |

The EL of the future is accountable for the same outcome — the right thing, built soundly,
shipped safely, operable afterwards — but the leverage is different: **judgement captured
as reusable, executable assets** rather than re-applied by hand.

---

## What this standard provides

| Component | What it gives an organisation |
|---|---|
| **An architecture, encoded** | [`.github/agents/senior-engineering-lead.agent.md`](.github/agents/senior-engineering-lead.agent.md) — a Copilot agent carrying a full stack: channels, Experience/Process/System layers, the dual async pipeline (CloudEvents over WebSocket vs HTTP), sagas, the Canonical Data Model, and the agentic authorization chain. Plus a [mobile-architect](.github/agents/mobile-architect.agent.md) specialist. |
| **An agentic application pattern** | [`demo/`](demo/README.md) — a running reference app where the agent reads state via readable context, acts only through validated tools, renders generative UI, and **pauses for human approval before anything that touches money**. |
| **A frontend architecture pattern** | A matched design system rebuilt as primitives, agentic + generative UI composition, and a mobile channel ([`frontend/RNModule/`](frontend/README.md)) with a versioned native component-catalogue contract under design. |
| **Executable governance** | The EL [playbook](docs/playbook/README.md) (roles, alignment, lifecycle gates, checklists), 12 artifact [templates](.github/templates/), and an [ADR discipline](docs/decisions/ADR-000-index.md). |
| **Regulated-domain guardrails** | [`.github/instructions/`](.github/instructions/) — compliance (PoPIA / PCI-DSS / NCA / FSCA) and architecture standards enforced at authoring time. |

---

## Start here — how the system works

Read in this order for the full picture:

1. **This page** — the thesis and the map.
2. **[The agentic reference app](demo/README.md)** — the clearest way to *see* the idea. Run it (`cd demo && npm install && npm run dev`) and talk to the copilot: it searches a catalogue, manages a cart, and pauses for approval before placing an order. Works with or without an LLM key.
3. **[The architecture workshop notes](docs/architecture/agentic-app-workshop-notes.md)** — how the same experience is taken from web to a React Native mobile app: the decisions made and the open questions still being worked.
4. **[The senior-engineering-lead agent](.github/agents/senior-engineering-lead.agent.md)** — the architecture everything sits inside: channels, the three layers, the async event model, the security chain.
5. **[The EL playbook](docs/playbook/README.md)** — how delivery is governed: roles, alignment, gates, checklists.

---

## Architecture & design decisions

Two pillars, held as equals.

**Frontend architecture**
- [`demo/README.md`](demo/README.md) — the agentic + generative UI pattern in depth: readable context, tools as the only path to data, generative components rendered in-chat, and human-in-the-loop approval that pauses the agent run.
- Design-system work — a published token set matched and re-implemented as primitives (`demo/src/components/ui/`, `demo/src/app/globals.css`).
- [`docs/architecture/agentic-app-workshop-notes.md`](docs/architecture/agentic-app-workshop-notes.md) — the hard mobile problems designed before code: the versioned native component-catalogue contract, streaming transport choice (SSE / WebSocket / polling), and server-as-source-of-truth state.

**Integration architecture**
- [`.github/agents/senior-engineering-lead.agent.md`](.github/agents/senior-engineering-lead.agent.md) — the dual async pipeline, the CloudEvents envelope and correlation/causation model, saga selection (orchestration vs choreography), the Canonical Data Model, and the anti-corruption Bridge over legacy integration.
- [`.github/agents/mobile-architect.agent.md`](.github/agents/mobile-architect.agent.md) — tri-platform (iOS / Android / Huawei HMS) deep-dives: HMS gap mitigation, device binding, push architecture.

**Shared discipline**
- [`docs/decisions/`](docs/decisions/ADR-000-index.md) — Architecture Decision Records (indexed; numbering starts at ADR-001).
- [`.github/templates/`](.github/templates/) — 12 reusable artifact templates (ADR, HLD, LLD, TDD, NFR, API contract, runbook, post-mortem, risk register, security review, test strategy, release plan).
- [`docs/architecture/SystemContext.drawio`](docs/architecture/SystemContext.drawio) — the system context diagram.

---

## Delivery, risk & operability

How the work is governed, not just designed.

- **[EL playbook](docs/playbook/README.md)** — [roles & RACI](docs/playbook/01-roles.md), [who to align with by engagement type](docs/playbook/02-alignment-by-context.md) (greenfield / brownfield / migration / provider onboarding), [lifecycle & decision gates](docs/playbook/03-lifecycle-and-gates.md), [cloud resource design](docs/playbook/04-cloud-resource-design.md), and [kickoff / design-review / go-live / handover checklists](docs/playbook/05-checklists.md).
- **Compliance guardrails** — [`banking-compliance.instructions.md`](.github/instructions/banking-compliance.instructions.md) and [`architecture-standards.instructions.md`](.github/instructions/architecture-standards.instructions.md).
- **Operability templates** — runbook, post-mortem, risk register, and security-review templates in [`.github/templates/`](.github/templates/).

Core principle, carried throughout: *involve the relevant stakeholders before introducing
a new pattern, and understand the existing patterns before changing them.*

---

## Adopting this in your organisation

The standard is designed to be forked and made your own:

1. **Re-point the architecture.** Replace the stack described in the `senior-engineering-lead` agent with your own layers, services, and integration fabric. The *shape* — encoded rules, enforced layer discipline, an explicit authorization chain — is the reusable part.
2. **Keep the governance, swap the regulator.** The playbook, templates, and ADR discipline are domain-neutral. Replace the PoPIA/PCI-DSS/NCA/FSCA guardrails with the regulations you answer to.
3. **Build your agentic product under the same rails.** Reuse the reference app's pattern: tools as the only path to data, readable context, and human approval before consequential actions.
4. **Make decisions executable.** Record choices as ADRs linked to their designs, and let the agent apply them consistently.

---

## Status & maturity

Stated plainly — a standard that overstates itself earns no trust.

| Component | What it is | Maturity |
|---|---|---|
| [`demo/`](demo/) | Agentic web reference app (Next.js + CopilotKit) | **Working** — runs with an LLM key or an offline demo agent |
| [`.github/`](.github/) | Encoded architecture, instructions, templates | **Reference** — complete and usable as-is |
| [`docs/playbook/`](docs/playbook/) | EL operating guide | **Reference** — complete and usable as-is |
| [`frontend/RNModule/`](frontend/) | React Native mobile channel | **Scaffold** — designed in docs before build |
| [`microservices/`](microservices/) | Backend services in Docker (.NET up; Node + Go planned) | **Scaffold** — .NET `/health` live on port 5001 |

Open decisions for the mobile reference are tracked as questions Q1–Q11 in the
[workshop notes](docs/architecture/agentic-app-workshop-notes.md). On the roadmap:
dedicated frontend- and integration-architecture pillar pages, the first ADRs (a new
external dependency; streaming transport; the component-catalogue contract), and a
written-up design-system and component-catalogue specification.

---

## Repository map

```
engineering-lead/
├── README.md                     ← you are here
├── demo/                         Agentic web reference app (Next.js + CopilotKit)
├── frontend/RNModule/            React Native mobile channel (scaffold)
├── microservices/                Backend reference services in Docker (.NET / Node / Go)
├── docs/
│   ├── architecture/             Workshop notes + system context diagram
│   ├── decisions/                Architecture Decision Records (ADRs)
│   └── playbook/                 Engineering Lead operating guide
└── .github/
    ├── agents/                   Encoded architecture: senior-engineering-lead, mobile-architect
    ├── instructions/             Architecture standards + regulated-domain compliance
    ├── templates/                12 EL artifact templates
    └── copilot-instructions.md   Repo-wide engineering guardrails
```

---

## Maintainer & licence

Maintained by **Letlhogonolo Obonye** (`l.obonye@accenture.com`).

Released under the **[Apache License 2.0](LICENSE)** — you are free to use, adapt, and
build on this reference standard in your own organisation, including commercially,
provided you retain the attribution and licence notices. Contributions and adaptations
are welcome; please keep this repository credited as the origin.

---

*A reference for agentic application engineering and the Engineering Lead function in a
regulated context. All data is mocked; no real customer data, credentials, or payments
are present.*
