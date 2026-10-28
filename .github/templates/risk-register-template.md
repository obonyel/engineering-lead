# Risk Register: [Programme / Component Name]

**Owner:** [Engineering Lead name]
**Last reviewed:** YYYY-MM-DD
**Next review:** YYYY-MM-DD
**Related HLD/SAD:** [links]

**Scoring:**
- Likelihood: 1 (rare) → 5 (near-certain)
- Impact: 1 (negligible) → 5 (critical/regulatory breach)
- Risk Score = Likelihood × Impact (1–25; Red ≥ 15, Amber 8–14, Green ≤ 7)

---

## Active Risks

| ID | Category | Risk Description | Likelihood | Impact | Score | RAG | Mitigation | Owner | Review Date | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| R001 | Technical | [Risk description] | 3 | 4 | 12 | 🟡 Amber | [Mitigation strategy] | [Owner] | YYYY-MM-DD | Open |
| R002 | Compliance | [Risk description] | 2 | 5 | 10 | 🟡 Amber | [Mitigation] | [Owner] | YYYY-MM-DD | Open |
| R003 | Delivery | [Risk description] | 4 | 3 | 12 | 🟡 Amber | [Mitigation] | [Owner] | YYYY-MM-DD | Open |

---

## Risk Categories

Use these categories for consistent tagging:

| Category | Examples |
|---|---|
| **Technical** | Architecture complexity, performance risk, integration failure, technical debt |
| **Security** | Data breach, unauthorized access, certificate expiry, PCI scope creep |
| **Compliance** | PoPIA violation, PCI-DSS failure, NCA/FSCA non-compliance, FICA gap |
| **Delivery** | Dependency delay, team capacity, skill gap, third-party delivery |
| **Operational** | Runbook coverage, on-call capacity, incident response readiness |
| **Financial** | Cost overrun, unplanned infrastructure scaling, vendor pricing change |
| **Strategic** | Scope change, stakeholder alignment, regulatory change |

---

## New Risk Entry Template

```
| ID | Category | Risk Description | Likelihood | Impact | Score | RAG | Mitigation | Owner | Review Date | Status |
| RNNN | [Cat] | As a [role], if [condition], then [consequence]. | [1-5] | [1-5] | [L×I] | 🔴/🟡/🟢 | [Action to reduce likelihood or impact] | [Name] | YYYY-MM-DD | Open |
```

**Well-formed risk description format:**
> "If [root cause/condition], then [consequence], resulting in [impact to business/customer/regulatory]."

Example:
> "If the Kafka cluster experiences an unplanned outage during peak payment processing hours, saga orchestrators will fail to receive completion events, resulting in stuck sagas and potential double-payment or failed payment reconciliation."

---

## Closed / Mitigated Risks

| ID | Risk Description | Resolution | Closed Date |
|---|---|---|---|
| RNNN | [Risk] | [How it was resolved] | YYYY-MM-DD |

---

## Risk Escalation Thresholds

| Score | Action Required |
|---|---|
| ≥ 20 (Red) | Immediate escalation to Head of Engineering + Programme Manager |
| 15–19 (Red) | Escalate to Engineering Lead + Product Owner; mitigation plan within 1 sprint |
| 8–14 (Amber) | Active management; reviewed every sprint |
| ≤ 7 (Green) | Monitor; reviewed monthly |
