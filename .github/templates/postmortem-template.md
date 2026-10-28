# Post-Incident Review: [INC-NNN] — [Short Title]

**Date of incident:** YYYY-MM-DD
**Duration:** [Start time UTC] → [End time UTC] ([N] hours [M] minutes)
**Severity:** `P1 — Critical` | `P2 — High` | `P3 — Medium`
**Service(s) affected:** [List]
**Author(s):** [Names]
**Reviewers:** [Names]
**Status:** `Draft` | `Final`
**Post-mortem meeting:** YYYY-MM-DD [time]

> **Blameless principle:** This document identifies system and process failures, not individual blame. The goal is learning and prevention, not accountability of persons.

---

## Summary

2–3 sentences: what happened, what the customer/business impact was, and what resolved it.

---

## Impact

| Metric | Value |
|---|---|
| Customer-facing errors | [N] failed requests / [%] of total traffic |
| Customers affected | [Estimate] |
| Financial transactions blocked | [N] (estimate value if available) |
| SLA breach | [Yes/No — duration vs. SLA budget] |
| External parties notified | [Regulators / partners / comms team] |

---

## Timeline (UTC)

| Time | Event | Who |
|---|---|---|
| HH:MM | Alert fired: [alert name] | PagerDuty auto |
| HH:MM | On-call engineer acknowledged | [Name] |
| HH:MM | [Investigation step] | [Name] |
| HH:MM | Root cause identified: [brief] | [Name] |
| HH:MM | Mitigation applied: [action] | [Name] |
| HH:MM | Service restored — error rate back to baseline | [Name] |
| HH:MM | Incident closed | [Name] |

**Detection time:** [Δ from first failure to alert] — target: < 5 min
**Time to mitigate:** [Δ from alert to mitigation applied]
**Time to resolve:** [Δ from alert to full resolution]

---

## Root Cause Analysis

**Root cause:** [Single clear statement of the root cause — not the symptom]

**5-Whys:**
1. Why did [symptom] occur? → Because [A]
2. Why did [A] occur? → Because [B]
3. Why did [B] occur? → Because [C]
4. Why did [C] occur? → Because [D]
5. Why did [D] occur? → Because **[root cause]**

---

## Contributing Factors

Factors that amplified impact or delayed detection/resolution:

- [Factor 1 — e.g., no runbook for this failure mode]
- [Factor 2 — e.g., alarm threshold too high — missed early signal]
- [Factor 3 — e.g., deployment without feature flag — no fast rollback path]

---

## What Went Well

- [E.g., circuit breaker activated as designed — prevented cascading failures]
- [E.g., on-call engineer responded within SLA]
- [E.g., rollback procedure was documented and executed in < 5 minutes]

---

## What Did Not Go Well

- [E.g., alert fired 12 minutes after first error — detection gap]
- [E.g., no runbook existed for this scenario — delayed triage]
- [E.g., CDM validation failure was not surfaced as a specific error code]

---

## Action Items

| ID | Action | Type | Owner | Due Date | Ticket |
|---|---|---|---|---|---|
| A1 | [Prevent recurrence action] | Prevention | [Owner] | YYYY-MM-DD | [JIRA] |
| A2 | [Improve detection] | Detection | [Owner] | YYYY-MM-DD | [JIRA] |
| A3 | [Improve response] | Response | [Owner] | YYYY-MM-DD | [JIRA] |
| A4 | [Update runbook for this scenario] | Documentation | [Owner] | YYYY-MM-DD | [JIRA] |

**Action types:** Prevention · Detection · Response · Documentation · Process

---

## Metrics

| Metric | Actual | Target | Delta |
|---|---|---|---|
| Detection time | [N] min | 5 min | [+/-N] min |
| Time to mitigate | [N] min | 30 min | [+/-N] min |
| Time to resolve | [N] min | 60 min | [+/-N] min |
| Customers impacted | [N] | 0 | [N] |
| Error budget consumed | [N]% of monthly budget | | |

---

## Lessons Learned

[1–3 sentences on the key engineering insight from this incident — suitable for sharing with a wider engineering audience]

---

## Appendices

- Alert details and query: [link]
- Log analysis: [link]
- Dashboard at time of incident: [snapshot link]
- Related ADRs: [ADR-NNN]
- Runbook (updated): [link]
