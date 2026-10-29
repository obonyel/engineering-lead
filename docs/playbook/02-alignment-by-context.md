# 2. Alignment by Engagement Type

The first question is always: **what already exists here?** The answer decides who you align with, in what order, and how much you can decide on your own.

> *Principle: understand the existing patterns before changing them; involve stakeholders before introducing new ones.*

## 2.1 Classify the engagement

| Type | Definition | Typical example on the super app |
|------|------------|----------------------------------|
| **Greenfield** | New product, no legacy to honour | New super-app vertical (e.g. a new lifestyle/rewards journey) on the existing platform, or the platform's first release |
| **Brownfield** | Changing or extending a live system | New feature in an existing journey; add a channel to an existing process API |
| **Bluefield** | New build alongside or inside existing estate; reuses some parts, replaces others | New Experience API on existing Process and System layers; new mobile module in an existing app shell |
| **Modernisation / strangler** | Incrementally replacing a legacy capability | Moving legacy integration flows behind clean Process APIs and CDM adapters, one route at a time |
| **Migration / replatform** | Same function, different platform | Moving workloads to a new cloud environment; major runtime or SDK upgrade |
| **Provider onboarding** | Connecting a new provider system | Add a new payments (e.g. PayShap), KYC (FICA), or utility provider behind a System-layer adapter |
| **Regulatory / compliance-driven** | Deadline set by regulator | Mandated authentication, consent, or reporting change |
| **Remediation / incident-driven** | Fixing something broken or risky | Post-mortem actions, audit findings, vulnerabilities |
| **Vendor / COTS integration** | Buying and configuring rather than building | Third-party SaaS / API provider integration |
| **Inherited / rescue** | Taking over a team or codebase mid-flight | Taking over a stalled workstream |

Many engagements are hybrids. Pick the dominant type, then add the extra alignments of the secondary one.

## 2.2 Greenfield

**Risk profile:** Over-design, ungoverned pattern invention, hidden dependencies on enterprise services you assumed were free.

**Align first with (in order):**
1. **PO + business sponsor:** outcome, success measures, budget envelope, target date drivers.
2. **Enterprise / Solution Architect:** guardrails, approved stack, reference architecture. Greenfield still lives inside the bank's estate.
3. **Security and Risk/Compliance:** classification of data and regulatory obligations *before* design (cheapest point).
4. **Platform / DevOps:** landing zone, subscription placement, naming and tagging (see [Doc 4](04-cloud-resource-design.md)).
5. **Integration Architect:** which System-layer providers it will depend on, even if "new".
6. **Frontend Architect:** where it sits in the app shell and design system.

**EL actions:** write the vision and constraints brief; run an architecture runway (2-4 weeks) producing HLD, NFRs, risk register, ADRs for key choices; agree walking skeleton in sprint 1-3; define Definition of Done including observability and security.

**Decision rights:** high within guardrails. New patterns still need ADR and architect consultation.

## 2.3 Brownfield

**Risk profile:** Breaking live behaviour, unknown coupling, tribal knowledge, regression, consumers on old app versions.

**Align first with (in order):**
1. **Tech Lead / Dev Lead of the existing system and its original authors:** how it really works (not how docs say).
2. **Operations / SRE (L2/L3):** incident history, fragile areas, on-call pain, change freezes.
3. **Integration Architect:** consumers of the APIs and events you will touch; contract and versioning impact.
4. **QA:** existing regression coverage; characterisation-test needs.
5. **BA:** current business rules as implemented (often differ from documented).
6. **PO:** acceptable risk to live customers; phased release.
7. **Frontend Architect:** supported app versions, force-upgrade policy.
8. **Risk/Compliance:** change-management and approvals for live banking functions.

**EL actions:** discovery spike and system map; characterisation tests before change; feature flags and dark launches; backward-compatible API changes first; rollback plan per release; consumer notification plan.

**Decision rights:** constrained. Existing patterns win unless an ADR with stakeholder agreement says otherwise. Do not "tidy up" outside scope.

## 2.4 Bluefield (new inside the old)

**Risk profile:** Seams. New code, old rules; mismatched standards; ownership gaps at the boundary.

**Align with:** all of Greenfield (1-4) for the new parts **and** Brownfield (1-3) for the parts you touch. Emphasise:
- **Integration Architect:** anti-corruption layer or adapter at the seam; canonical model mapping.
- **Owners of the existing components:** written agreement on who owns the seam, SLAs, and change protocol.

**EL actions:** draw the boundary explicitly; contract tests at the seam; decide per component *reuse / wrap / replace* and record it.

## 2.5 Modernisation / strangler

**Align with:** Enterprise Architect (target state and sequencing), Integration Architect (routing/facade strategy), Operations (parallel-run support), PO (value of each slice), Risk (decommission approvals), consumers of the legacy interface.

**EL actions:** slice by business capability; facade first, then migrate behind it; parallel-run and reconcile; set the decommission criteria up front; keep a "legacy burn-down" metric. Never run two sources of truth without a reconciliation owner.

## 2.6 Migration / replatform

**Align with:** Platform/DevOps (target environment), Security (control parity), Data Architect/Owner (residency, retention), Operations (cutover and rollback), Risk/Compliance (regulator notification where cloud or outsourcing change), and all consumers.

**EL actions:** inventory, dependency map, cutover plan with rehearsals, rollback criteria, freeze windows agreed with PO and business.

## 2.7 Provider onboarding (System layer)

**Align with:** Provider platform owner (contract, SLA, test windows, change calendar), Integration Architect (contract, canonical mapping, saga/compensation), Security (auth between layers), Operations (monitoring and support model), BA (business rules in provider vs process layer), Risk (third-party risk assessment).

**EL actions:** contract-first with provider sign-off; stubs/mocks so the team is not blocked; agree error taxonomy, idempotency keys, timeouts; non-prod environment availability confirmed before sprint planning; support model and escalation contacts in the runbook.

## 2.8 Regulatory-driven

**Align with:** Risk/Compliance first (exact obligation and deadline), then Security, PO (scope is fixed, so squeeze elsewhere), Architects.

**EL actions:** map clause to requirement to story (traceability); fixed date means variable scope: agree the minimum compliant slice; engage assurance/audit early; evidence capture built into delivery.

## 2.9 Remediation / incident-driven

**Align with:** Operations and incident manager, Security (if a vulnerability), Risk, PO, Tech Lead.

**EL actions:** stabilise first, then fix cause; post-mortem (`.github/templates/postmortem-template.md`); track actions to closure; add the missing test/alert so it cannot recur silently.

## 2.10 Vendor / COTS (e.g. MARTECH)

**Align with:** Vendor technical lead, Enterprise Architect (fit and exit strategy), Security (vendor risk), Data Architect (what data leaves the bank), Integration Architect (event and API integration), Procurement.

**EL actions:** configure over customise; define the integration contract; plan for upgrades and licensing cliffs; get an exit plan on record.

## 2.11 Inherited / rescue

**Align with:** Sponsor (mandate and what "rescued" means), outgoing lead (knowledge transfer, time-boxed), the team (listen first), Operations, QA.

**EL actions:** first 30 days: assess code health, delivery metrics, risks, team morale; produce a current-state report; stop the bleeding (broken pipeline, no tests, no alerts); agree a recovery plan with the sponsor.

## 2.12 Quick decision table

| Question | If yes, align with |
|----------|--------------------|
| Does it touch customer money or balances? | Risk/Compliance, Security, Integration Architect, Operations |
| Does it handle personal data? | Data Owner, Security, Risk (POPIA) |
| Does it change a public or shared API? | Integration Architect + all consumers |
| Does it change what ships in the app? | Frontend Architect, PO, release manager (store review lead time) |
| Does it need new Azure resources? | Platform/DevOps (placement, naming, tagging, cost) |
| Does it cross the on-prem/cloud boundary? | Integration Architect, Network, Security |
| Is there a fixed external deadline? | PO, Risk, Delivery Manager |
| Does anyone else own the thing you want to change? | **Their owner, before you design** |

## 2.13 Alignment cadence

| Forum | Frequency | Attendees | Purpose |
|-------|-----------|-----------|---------|
| Architecture / design review | Weekly or per HLD/LLD | EL, Tech Lead, both Architects, Security | Approve designs and ADRs |
| Refinement | Weekly | PO, BA, Dev Lead, Tech Lead, QA | Definition of Ready |
| Dependency sync | Weekly | EL, Integration Architect, provider owners | Contracts, environments, change calendar |
| Release readiness | Per release | EL, PO, QA, DevOps, Ops, Security | Go/no-go |
| Risk review | Fortnightly | EL, Delivery, Risk | RAID and risk register |
| Sponsor update | Fortnightly / monthly | EL, PO, Delivery, sponsor | Outcomes, risks, decisions needed |
