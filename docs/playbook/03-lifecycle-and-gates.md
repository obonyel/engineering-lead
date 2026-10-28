# 3. Engagement Lifecycle and Gates

Each phase lists purpose, lead, key activities, artifacts (templates in `.github/templates/`) and the **gate** to pass. Depth scales with engagement type (see [Doc 2](02-alignment-by-context.md)): greenfield spends longer in Phase 1; brownfield spends longer in Phase 0.

| Phase | Lead | Main artifacts | Gate |
|-------|------|----------------|------|
| 0. Discover | EL + BA | Stakeholder register, current-state map (brownfield), constraints | G0: Mandate and scope understood |
| 1. Shape and design | EL + Architects | HLD, NFRs, risk register, ADRs, test strategy | G1: Architecture approved |
| 2. Build | Dev Lead + Tech Lead | LLD, API contracts, code, tests | G2: Definition of Done met per increment |
| 3. Verify | QA + EL | Test reports, security review, performance results | G3: Release readiness |
| 4. Release | EL + DevOps | Release plan, runbook | G4: Go/no-go |
| 5. Operate and handover | Operations + EL | Runbook, SLOs, handover pack | G5: Accepted by run team |
| 6. Learn | EL | Post-mortem / retrospective | n/a |

## Phase 0: Discover
- Identify and register stakeholders (Checklist 5.1); classify the engagement type.
- Brownfield: map the system, consumers, incident history; run characterisation tests.
- Clarify mandate: outcome, constraints, deadline drivers, budget.
- **G0 exit:** sponsor and PO agree outcomes; engagement type recorded; owners of every touched component identified.

## Phase 1: Shape and design
- HLD (`hld-template.md`): layers touched (Experience / Process / System), channels, flows, failure modes.
- NFRs (`nfr-template.md`): availability, latency, throughput, RTO/RPO, accessibility, data residency.
- ADRs for every pattern decision and any deviation.
- Threat model and security review (`security-review-template.md`).
- Risk register (`risk-register-template.md`); test strategy (`test-strategy-template.md`).
- Cloud resource placement agreed with Platform (Doc 4).
- **G1 exit:** HLD signed by EL, Integration Architect, Frontend Architect, Security; open risks have owners; NFRs testable.

## Phase 2: Build
- API contracts first (`api-contract-template.yaml`); mocks published before implementation.
- LLD per component (`lld-template.md`) by Tech Lead.
- Definition of Done: tests, code review, security scan clean, observability (logs, metrics, traces, alerts), docs, feature flag where appropriate.
- Demo every sprint; EL reviews technical health metrics (build time, coverage trend, defect escape, PR age).
- **G2 per increment:** DoD met; contracts unchanged or versioned; no new unmanaged high risks.

## Phase 3: Verify
- Functional, contract, end-to-end, performance, resilience (failure injection on provider timeouts), security testing, accessibility, device matrix (iOS, Android, Huawei).
- UAT with BA and business.
- **G3 exit:** exit criteria in test strategy met; high/critical defects closed or formally accepted; pen-test findings dispositioned.

## Phase 4: Release
- Release plan (`release-plan-template.md`): sequence (backend then client), feature flags, app-store timing, rollback, comms.
- Change approvals; freeze windows checked.
- **G4 go/no-go (EL accountable):** release readiness checklist (5.3) green; rollback tested; run team ready; business sign-off by PO.

## Phase 5: Operate and handover
- Runbook (`runbook-template.md`); dashboards and alerts live; on-call named.
- Hypercare period with explicit exit criteria.
- **G5 exit:** Operations accepts; support model and escalation paths confirmed; known issues documented.

## Phase 6: Learn
- Retrospective; post-mortem for any significant incident; update this playbook and ADR index.

## Escalation ladder

1. Peer role (e.g. Tech Lead to Integration Architect), one working day.
2. EL facilitates a decision session, within the next review cycle.
3. Escalate to sponsor / architecture board with options and a recommendation; never escalate without a recommendation.
4. Record outcome as an ADR.
