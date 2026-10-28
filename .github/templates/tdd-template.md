# Technical Design Document: [Feature / Component Name]

**Version:** 1.0
**Author(s):** [Names]
**Reviewers:** [Names and roles]
**Status:** `Draft` | `In Review` | `Approved`
**Date:** YYYY-MM-DD
**Related Epic/Ticket:** [JIRA/GitHub link]
**Related ADR(s):** [ADR-NNN links]

**Layer:** `Experience` | `Process` | `System` | `Cross-cutting`
**Ownership:** 🟢 Nedbank | 🟡 ACN-enhanced | 🟣 ACN-new

---

## 1. Executive Summary

2–3 sentences: what is being built, why, and what it replaces or enables.

## 2. Background and Problem Statement

Current state: [what exists today and what pain or gap it creates]
Business driver: [the requirement — regulatory, revenue, risk, UX]
Constraints: [technical, compliance, timeline, team capacity]

## 3. Goals and Non-Goals

**Goals:**
- [Measurable outcome 1]
- [Measurable outcome 2]

**Non-Goals (explicitly out of scope):**
- [Out of scope item 1 — prevents scope creep]
- [Out of scope item 2]

## 4. Architecture Layer and Ownership

| Attribute | Value |
|---|---|
| Primary layer | Experience / Process / System |
| Ownership | 🟢/🟡/🟣 |
| Consuming channels | Mobile / Web / Conversational |
| Upstream dependencies | [list services this depends on] |
| Downstream dependents | [list services that depend on this] |

## 5. Proposed Solution

High-level narrative of the approach. Describe the "what" and "why" before the "how."

### 5.1 Architecture Diagram

```
[C4 Container or Sequence diagram — use Mermaid]

sequenceDiagram
    participant Mobile
    participant NCP_BE
    participant ExperienceAPI
    participant ProcessAPI
    participant ProviderSystem
```

### 5.2 Component Responsibilities

| Component | Responsibility |
|---|---|
| [Component A] | [What it does in this feature] |
| [Component B] | [What it does] |

## 6. Detailed Design

### 6.1 API Contract

Reference: `.github/templates/api-contract-template.yaml`

Key endpoints:
```yaml
POST /v1/[resource]:
  Request: { ... }
  Response 202: { ... }
  Response 400: Problem Details (RFC 9457)
  Response 422: { errorCode, message }
```

### 6.2 Saga / Workflow Design (if applicable)

**Saga type:** `Orchestration` | `Choreography` | `Hybrid`
**Rationale:** [Why this type was chosen — see ADR]

**Happy path:**
1. [Step 1: command → service → event]
2. [Step 2]
3. [Step N]

**Compensation steps (on failure at step N):**
- Failure at Step 2 → compensate Step 1 by [action]
- Failure at Step 3 → compensate Step 2 and Step 1

**Idempotency:** Every step accepts an idempotency key. Duplicate execution is a no-op.

### 6.3 Event Design (if applicable)

**Kafka topic:** `{domain}.{entity}.{event}` — e.g., `payments.transfer.initiated`
**Avro schema:** [Schema Registry URL or inline]

```json
{
  "type": "record",
  "name": "TransferInitiated",
  "namespace": "za.co.bank.payments",
  "fields": [
    { "name": "correlationId", "type": "string" },
    { "name": "transferId", "type": "string" },
    { "name": "amount", "type": { "type": "bytes", "logicalType": "decimal", "precision": 18, "scale": 4 } },
    { "name": "currency", "type": "string" },
    { "name": "initiatedAt", "type": { "type": "long", "logicalType": "timestamp-millis" } }
  ]
}
```

### 6.4 Data Model

| Field | Type | CDM Reference | Description |
|---|---|---|---|
| [field] | [type] | [CDM.Entity.Field] | [description] |

### 6.5 Error Handling

| Error Scenario | HTTP Status | Error Code | Recovery |
|---|---|---|---|
| [Scenario] | 4xx/5xx | [CODE] | [Retry / fail / compensate] |

### 6.6 Security Controls

- Authentication: [OAuth scope required]
- Authorization: [RBAC role / ABAC policy]
- Data classification: [Public / Internal / Confidential / Restricted]
- PCI scope impact: [Yes/No + explanation]
- PoPIA: [Personal data handled? Consent required?]
- Step-up required: [Yes/No — threshold/condition]
- Audit event: [Event type emitted on state change]

## 7. Non-Functional Requirements

| Attribute | Requirement | Measurement Method |
|---|---|---|
| Availability | 99.95% (excl. maintenance) | SLO dashboard |
| Latency (p99) | < [X]ms end-to-end | APM traces |
| Throughput | [X] TPS sustained | Load test |
| RTO | [X] hours | DR test |
| RPO | [X] hours | DR test |

## 8. Testing Strategy

| Test Type | Scope | Tool | Coverage Target |
|---|---|---|---|
| Unit | Business logic | JUnit 5 / Jest / XCTest | 80% |
| Integration | Service boundaries | Testcontainers / Pact | Key happy paths |
| Contract | API consumers/providers | Pact / Spring Cloud Contract | All endpoints |
| Performance | Sustained TPS + spike | Gatling / k6 | NFR targets |
| Security | OWASP Top 10 | OWASP ZAP / Burp Suite | DAST scan |
| Chaos | Dependency failure | Chaos Monkey / k6 | Resilience4j triggers |

## 9. Deployment and Rollout Plan

- [ ] Feature flag: `[flag_name]` — starts at 0%, gates rollout
- [ ] Phase 1 (1%): [criteria to advance]
- [ ] Phase 2 (10%): [criteria]
- [ ] Phase 3 (100%): [criteria]
- [ ] Rollback trigger: [metric threshold that triggers rollback]
- [ ] Rollback procedure: [steps — disable flag / redeploy previous version]

## 10. Operational Considerations

- Logging: [key log events and fields]
- Alerts: [alert names + runbook links]
- On-call handoff notes: [what to watch in first 24h post-deploy]

## 11. Open Questions and Risks

| ID | Question / Risk | Owner | Due Date | Status |
|---|---|---|---|---|
| Q1 | [Question] | [Owner] | YYYY-MM-DD | Open |

## 12. Appendices

- [Glossary]
- [References]
- [ADR links]
- [Proof of concept results]
