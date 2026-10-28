# ADR-[NNN]: [Short Title — present tense, active voice]

**Date:** YYYY-MM-DD
**Status:** `Proposed` | `Accepted` | `Deprecated` | `Superseded by ADR-NNN`
**Deciders:** [Names and roles]
**Consulted:** [Names and roles]
**Informed:** [Teams / stakeholders to be notified]

**Layer:** `Experience` | `Process` | `System` | `Cross-cutting`
**Ownership:** 🟢 Nedbank existing | 🟡 ACN-enhanced | 🟣 ACN-new
**Related ADRs:** [ADR-NNN links]
**Related TDD/HLD:** [links]

---

## Context

What is the situation, problem, or opportunity that motivates this decision?
Include: technical constraints, business drivers, regulatory requirements, and any prior art or failed approaches.

## Decision Drivers

- [Driver 1 — e.g., availability requirement: 99.95% SLA]
- [Driver 2 — e.g., PCI-DSS scope must not expand]
- [Driver 3 — e.g., delivery constraint: must ship within 2 sprints]

## Decision

> **We will [do X] in order to [achieve Y], accepting [trade-off Z].**

State the decision clearly in one sentence. Avoid hedging language.

## Options Considered

### Option A: [Name] — [CHOSEN / REJECTED]

**Description:** Brief explanation of this approach.

**Pros:**
- [Pro 1]
- [Pro 2]

**Cons:**
- [Con 1]
- [Con 2]

**Reason for selection/rejection:** [Clear rationale]

---

### Option B: [Name] — [REJECTED]

**Description:** Brief explanation.

**Pros / Cons / Reason:** [Summarise]

---

### Option C: [Name] — [REJECTED]

**Description / Pros / Cons / Reason:** [Summarise]

---

## Consequences

**Positive outcomes:**
- [What this enables or improves]

**Negative consequences / trade-offs:**
- [What becomes harder or more expensive]

**Risks introduced:**
- [New risks; link to Risk Register if significant]

**Technical debt impact:** [Adds / Reduces / Neutral]

## Compliance and Security Impact

- PCI-DSS scope: [Expands / No change / Reduces]
- PoPIA impact: [Any personal data handling changes]
- FSCA/NCA: [Any regulatory implications]
- Audit trail: [Changes to audit coverage]

## Confirmation

How will this decision be validated?
- [ ] POC/spike results: [link]
- [ ] Architecture review board sign-off
- [ ] Security review: [link]
- [ ] NFR validation: [test method]

## Y-Statement Summary

> In the context of **[use case]**, facing **[concern]**, we decided for **[option]** to achieve **[quality]**, accepting **[downside]**, because **[rationale]**.
