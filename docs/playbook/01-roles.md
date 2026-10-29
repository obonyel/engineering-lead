# 1. Roles and Responsibilities

## 1.1 Core delivery roles

### Business Analyst (BA)
**Purpose:** Turn business need into clear, testable requirements.
- **Owns:** Business requirements, process maps, user stories with acceptance criteria, business rules, data/field definitions, UAT scripts.
- **Brings to the EL:** Who the real stakeholders are, regulatory/business rules, journey pain points, scope boundaries.
- **EL expects:** Requirements traceable to stories; ambiguity flagged, not guessed; non-functional needs captured (volumes, limits, availability) not just functional.
- **Align on:** Definition of Ready, scope changes, rules that affect saga/process design (limits, cut-offs, eligibility).
- **Red flags:** Stories that describe solutions rather than outcomes; no acceptance criteria; NFRs missing.

### Product Owner (PO)
**Purpose:** Maximise value delivered; owns the "what" and "in what order".
- **Owns:** Product vision, backlog and priorities, release scope, acceptance of work, stakeholder expectations on value.
- **Brings to the EL:** Priority calls, trade-off decisions (scope vs date), business sign-off.
- **EL expects:** Prioritised, refined backlog; decisions within a sprint, not a month; willingness to fund enablers (tech debt, platform, observability).
- **Align on:** Roadmap vs technical dependencies, enabler work, release slicing, what "done" means for a banking release.
- **Red flags:** Everything is P1; enablers perpetually deprioritised; scope added after commitment without trade-off.

### Dev Lead
**Purpose:** Day-to-day delivery of the code and the team that writes it.
- **Owns:** Team throughput and quality, code reviews, engineering standards in practice, sprint execution, estimates, developer growth, pull-request hygiene, CI health.
- **Brings to the EL:** Realistic estimates, team capacity and morale, delivery risks early, implementation feedback on designs.
- **EL expects:** Standards followed (branching, testing, review); blockers surfaced within a day; honest status.
- **Align on:** Capacity vs commitment, tech debt allocation, team structure across Android mobile and backend services, onboarding.
- **Distinguish from Tech Lead:** Dev Lead = *how the team delivers*; Tech Lead = *what the design is*. On small teams one person holds both; split once the team exceeds roughly 8 engineers or covers multiple platforms.

### Tech Lead
**Purpose:** Technical direction of a solution or component within architectural guardrails.
- **Owns:** Detailed design (LLD), technology choices within the approved stack, technical quality (performance, security basics, testability), ADRs at component level, spikes and proofs of concept.
- **Brings to the EL:** Feasibility, technical risks, options with trade-offs, reality of the existing code.
- **EL expects:** Designs that respect architecture standards; options laid out with a recommendation; deviations raised as ADRs.
- **Align on:** Patterns (saga, handler, adapter), service boundaries, build vs reuse, tech debt.
- **Red flags:** Design only in heads; silent deviation from reference architecture; hero-dependency.

## 1.2 Architecture roles

### Integration Architect
**Purpose:** Own how systems talk to each other across Experience, Process and System layers.
- **Owns:** API strategy and contracts (REST/AG-UI streaming), canonical data model, integration patterns (ACID transactions, sagas, anti-corruption adapters), idempotency and rate-limiting policy, edge/gateway security, provider-system onboarding.
- **Brings to the EL:** Dependency map, contract status of every provider system, versioning strategy, failure-mode analysis.
- **EL expects:** Contract-first; consumer-driven contract tests; timeout/retry/circuit-breaker standards; schema governance.
- **Align on:** Who owns each API, compensation design, SLAs with provider teams, environment availability for test.
- **Engage early when:** New provider system, new agentic tool contract, any change to canonical model.

### Frontend / Mobile Architect
**Purpose:** Own the client architecture on the Android mobile channel and native generative UI contract.
- **Owns:** Android React Native (Expo) module boundaries, `@copilotkit/react-native/headless` AG-UI client integration, design system and native Generative UI component catalogue, state management, offline/resilience strategy, navigation and deep-linking, feature flags, client-side security (`expo-secure-store`, hardware `BiometricPrompt`, device integrity with Security).
- **Brings to the EL:** Android release train constraints (EAS / Firebase App Distribution / Play Store), bundle health, component-catalogue versioning impact.
- **EL expects:** Zero business logic in the client; backwards-compatible API consumption; telemetry in every feature.
- **Align on:** Experience API and AG-UI tool contracts with Integration Architect, design system with UX, release cadence with PO.
- **Red flags:** Business logic leaking into the client; unversioned generative UI payloads; no force-upgrade strategy.

### Solution / Enterprise Architect (adjacent)
Owns target-state architecture and cross-programme standards. The EL consults on guardrails and escalates deviations. Integration and Frontend Architects work within these guardrails.

## 1.3 Supporting roles

| Role | Owns | EL aligns on |
|------|------|--------------|
| **Security Architect / CISO office** | Threat models, identity (OAuth 2.0/OTP, POPIA consent, hardware biometric step-up, HITL gates), pen-test, key management | Threat model before build; security review gate |
| **Risk and Compliance** | Regulatory obligations (POPIA, PCI-DSS, FICA, FAIS/FSCA, SARB directives), operational-risk sign-off | Risk register, data residency, regulatory boundaries |
| **Data Architect / Data Owner** | Data classification, ledger schema, `pgvector` knowledge store, lineage, retention | PII handling, analytics events, consent |
| **QA / Test Lead** | Test strategy, automation, performance and non-functional testing, test data | Test environments, entry/exit criteria |
| **DevOps / Platform Engineer** | CI/CD, IaC, environments, observability stack, secrets | Landing zone, pipelines, cost, SLOs |
| **SRE / Operations (L2/L3)** | Run, incident response, on-call, capacity | Runbooks, handover, error budgets |
| **UX / Service Designer** | Journeys, design system | Design-to-build handoff, accessibility |
| **Delivery / Programme Manager** | Plan, budget, RAID, vendor management | Dependencies, resourcing, escalation |
| **Provider-system / Platform Owners** | Wealth, Rewards, Insurance, Payments, Lending, Cards, etc. | API contracts, SLAs, test windows, change calendars |

## 1.4 The Engineering Lead

- **Accountable for:** technical delivery outcome, engineering standards, alignment across all roles above, technical risk management, release readiness, handover to run.
- **Does:** facilitate decisions, write or approve ADRs, run design reviews, maintain RAID for technical items, shield the team, communicate technical status upward in business language.
- **Does not:** reprioritise the backlog (PO), rewrite requirements (BA), override architects' guardrails without an ADR and escalation, or become the bottleneck for detailed design.

## 1.5 RACI by decision

| Decision | EL | BA | PO | Dev Lead | Tech Lead | Integ. Arch | Frontend Arch | Security | QA |
|----------|----|----|----|----------|-----------|-------------|---------------|----------|----|
| Scope and priority | C | R | **A** | C | C | I | I | I | I |
| Requirements and acceptance criteria | C | **A/R** | C | I | C | C | C | C | C |
| Solution approach (HLD) | **A** | C | C | C | R | R | R | C | C |
| API contract / canonical model | C | C | I | I | R | **A** | C | C | C |
| Client architecture / SDK | C | I | I | C | R | C | **A** | C | I |
| Detailed design (LLD) | C | I | I | C | **A/R** | C | C | C | C |
| Sprint plan and capacity | C | I | C | **A/R** | C | I | I | I | I |
| Test strategy | C | C | C | C | C | C | C | C | **A/R** |
| Security approach | C | I | I | I | C | C | C | **A** | I |
| Release go/no-go | **A** | C | R | R | R | C | C | C | R |
| New pattern / deviation (ADR) | **A** | I | I | C | R | C | C | C | I |

## 1.6 Role-tension cheat sheet

| Tension | EL's move |
|---------|-----------|
| PO wants scope, Dev Lead says no capacity | Make the trade-off explicit in writing; PO chooses what leaves |
| Integration vs Frontend Architect disagree on BFF vs generic API | Facilitate options in an ADR; EL decides if no consensus in one review cycle |
| BA requirement impossible on a provider system | Integration Architect assesses; BA and PO decide whether to change the rule or the scope |
| Tech Lead wants new framework | Apply the principle: stakeholders first, existing pattern understood, ADR |
| Security blocks a release | Understand the risk; seek mitigation plan or time-boxed risk acceptance signed by the risk owner |
