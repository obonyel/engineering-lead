# 5. Checklists

## 5.1 Kickoff and stakeholder alignment

- [ ] Engagement type classified (greenfield / brownfield / bluefield / other) and recorded
- [ ] Sponsor and PO named; outcomes and success measures written down
- [ ] Stakeholder register: BA, PO, Dev Lead, Tech Lead, Integration Architect, Frontend Architect, Security, Risk, Data Owner, QA, DevOps, Operations, provider owners
- [ ] Owner identified for every existing component being touched
- [ ] Existing patterns, standards and landing-zone constraints reviewed
- [ ] Constraints: deadline drivers, regulatory items, change-freeze windows, budget
- [ ] Working agreements: forums and cadence (Doc 2.13), escalation ladder (Doc 3)
- [ ] Initial RAID log and risk register started

## 5.2 Design review (HLD / ADR)

- [ ] Problem and options stated; recommendation given
- [ ] Layers and boundaries clear (Experience / Process / System); no business logic in the client
- [ ] Integration Architect reviewed contracts, sagas/compensation, idempotency, timeouts, back-pressure
- [ ] Frontend Architect reviewed client impact, supported app versions, platform parity (iOS, Android, Huawei)
- [ ] Security threat model done; data classification and consent flows covered
- [ ] NFRs specified and testable; observability designed in
- [ ] Failure modes and fallback behaviour documented
- [ ] Impact on existing consumers and rollback considered
- [ ] Deviations from standards recorded as ADRs and agreed by stakeholders

## 5.3 Release readiness (go/no-go)

- [ ] DoD met for all scope; PO accepted
- [ ] Test exit criteria met; no open critical/high defects without signed acceptance
- [ ] Performance and resilience results meet NFRs
- [ ] Security review and pen-test findings dispositioned
- [ ] Contracts backward compatible; consumers notified
- [ ] Backend deployed before client; feature flags and kill-switches ready
- [ ] App-store submission timing planned (iOS, Android, Huawei AppGallery)
- [ ] Rollback plan tested; data migration reversible or reconciled
- [ ] Runbook, dashboards, alerts and on-call in place; Operations briefed
- [ ] Change approval obtained; outside freeze window
- [ ] Comms prepared (internal, support, customer where needed)

## 5.4 Handover to run

- [ ] Runbook reviewed with L2/L3
- [ ] SLOs and alert thresholds agreed; alerts route to the right team
- [ ] Known issues and workarounds documented
- [ ] Access, secrets rotation and DR procedures documented and tested
- [ ] Support model, escalation contacts, provider contacts listed
- [ ] Hypercare exit criteria defined
- [ ] Knowledge-transfer sessions held and recorded

## 5.5 First 30 days as EL on a new or inherited engagement

- [ ] Meet every role in 1.1-1.3 one-to-one; ask "what would you change?"
- [ ] Read ADRs, HLDs, recent post-mortems, current risk register
- [ ] Review delivery metrics: cycle time, deployment frequency, defect escape, PR age
- [ ] Walk the pipeline and an environment end to end
- [ ] Identify the top 5 technical risks and the top 3 quick wins
- [ ] Write a current-state summary and share it with the sponsor and PO
- [ ] Agree the first 90-day plan

## 5.6 Weekly EL rhythm

- [ ] Review RAID and risk register; update owners
- [ ] Check the dependency map and provider environment status
- [ ] Attend architecture review; clear pending ADRs
- [ ] Check team health with Dev Lead: capacity, blockers, morale
- [ ] Review technical health metrics trend
- [ ] Confirm next sprint's scope has no unresolved technical dependencies
- [ ] Send a short status in business language (outcomes, risks, decisions needed)
