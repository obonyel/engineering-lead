# Test Strategy: [Feature / Component / Release Name]

**Version:** 1.0
**Author:** [Name]
**Date:** YYYY-MM-DD
**Status:** `Draft` | `Approved`
**Related TDD:** [link]
**Related NFR:** [link]

---

## 1. Scope

**In scope for this test strategy:**
- [Service/component A]
- [Feature B]

**Out of scope:**
- [Explicitly excluded]

## 2. Test Levels and Objectives

### 2.1 Unit Tests

**Objective:** Verify individual functions, methods, and classes in isolation
**Coverage target:** ≥ 80% line coverage; 100% for payment calculation and risk-scoring paths
**Tools:** JUnit 5 + Mockito (Java/Kotlin) · Jest (TypeScript) · XCTest (Swift) · pytest (Python)
**Who writes:** Developers; test written before or alongside code (TDD encouraged)
**CI gate:** Build fails if coverage drops below target

**Key areas requiring unit test focus:**
- [Business logic component] — all edge cases including [specific edge case]
- [Validation logic] — every error code path
- [CDM transformation] — all field mappings, null handling, type conversions

### 2.2 Integration Tests

**Objective:** Verify components work together across real boundaries (database, Kafka, Redis, other services via testcontainers)
**Tools:** Testcontainers (Docker-based real dependencies) · Spring Boot Test · SuperTest (Node.js)
**Who writes:** Developers and QA engineers jointly
**CI gate:** Integration test suite must pass before merge to main

**Key integration test scenarios:**
- [Scenario: end-to-end happy path for the primary use case]
- [Scenario: dependency failure handling — e.g., downstream service returns 500]
- [Scenario: Kafka message consumption and idempotency]
- [Scenario: database constraint violations]

### 2.3 Contract Tests

**Objective:** Verify that API consumer expectations match provider implementations; detect breaking changes before integration
**Tools:** Pact (consumer-driven contract testing) · Spring Cloud Contract
**Who writes:** Consumer team writes consumer contracts; provider team runs them
**CI gate:** Provider pipeline runs consumer contracts on every build; fails on contract violation
**Broker:** [Pact Broker URL]

**Contract pairs:**
| Consumer | Provider | Contract location |
|---|---|---|
| Mobile (NCP SDK) | NCP BE | [Pact Broker link] |
| NCP BE | Experience API | [link] |
| Experience API | Process API | [link] |
| Process API | [Provider System] | [link] |

### 2.4 End-to-End (E2E) Tests

**Objective:** Verify critical user journeys work across the full stack in a staging environment
**Tools:** Playwright (Web) · Detox (React Native) · XCUITest (iOS) · Espresso (Android) · Appium
**Who writes:** QA automation engineers
**Environment:** Staging (with all real dependencies, test data)
**Frequency:** Run on every release candidate; subset on every PR (smoke suite)

**Critical journeys (must always pass before release):**
1. [User journey 1 — e.g., Login → View balance → Initiate payment → Confirm via OOBV → View receipt]
2. [User journey 2]
3. [HMS-specific journey — verify on Huawei test device]

### 2.5 Performance Tests

**Objective:** Validate NFR targets under realistic and peak load
**Tools:** Gatling · k6
**Environment:** Staging with production-like data volumes
**Schedule:** Run per release candidate; automated on weekly schedule

**Test scenarios:**

| Scenario | TPS | Duration | Pass Criteria |
|---|---|---|---|
| Sustained load | [NFR target TPS] | 30 min | p99 < [X]ms, error rate < 0.1% |
| Spike test | 2× peak TPS | 5 min | No errors; circuit breaker activates within 30s |
| Soak test | [N]× base | 4 hours | No memory leak; latency stable |
| Kafka consumer lag | [N messages/s] | 30 min | Consumer lag < [N] messages |

### 2.6 Security Tests

**Objective:** Identify vulnerabilities before production
**Tools:** OWASP ZAP (DAST) · Semgrep / SonarQube (SAST) · OWASP Dependency-Check · Burp Suite (manual)
**Schedule:** SAST on every PR; DAST on every staging deploy; manual pen test annually

**Security test checklist:**
- [ ] OWASP Top 10 automated scan (ZAP)
- [ ] SQL/NoSQL injection attempts on all endpoints
- [ ] Authentication bypass attempts
- [ ] Authorisation: attempt to access other users' data (IDOR)
- [ ] Certificate pinning verification: confirm MITM proxy is rejected
- [ ] Input validation: boundary values, special characters, oversized payloads
- [ ] PCI DSS controls: confirm card data not present in logs

### 2.7 Chaos / Resilience Tests

**Objective:** Verify the system remains stable and fails safely under dependency failures
**Tools:** Chaos Monkey · Toxiproxy · k6 scenarios
**Schedule:** Quarterly; before major releases

**Chaos scenarios:**
| Scenario | Expected Behaviour |
|---|---|
| Kill one service instance during load | Load balancer routes away; no customer error |
| Kafka broker unreachable | Back pressure activates; DLQ captures messages; no data loss |
| Downstream provider returns 500 | Circuit breaker opens → safe degraded response |
| Database connection pool exhausted | Queue with backpressure; 429 to caller; no crash |
| Certificate expiry (simulated) | Alert fires; cert rotation procedure triggered |

---

## 3. Test Data Strategy

- Production data must never be used in non-production environments
- Synthetic test data generated from the CDM schema: [data generation tool/service]
- PII in test data: masked/anonymised synthetic values only
- Kafka test events: seeded via [test event publisher tool]
- Test user accounts provisioned in staging via: [setup procedure]

## 4. Test Environments

| Environment | Purpose | Data | Refresh Frequency |
|---|---|---|---|
| Local (dev) | Unit + integration (testcontainers) | Synthetic | Per run |
| CI | Unit + contract + integration | Synthetic | Per commit |
| Staging | E2E + performance + security + UAT | Anonymised synthetic | Weekly |
| Production | Synthetic monitoring only | None (real system) | Continuous |

## 5. Entry and Exit Criteria

**Entry criteria (before testing starts):**
- [ ] Code merged to feature branch; CI green
- [ ] Test data prepared
- [ ] Environment healthy (all dependencies responsive)

**Exit criteria (before release):**
- [ ] Unit test coverage ≥ 80%
- [ ] Zero P1/P2 defects open
- [ ] Performance NFR targets met in latest load test run
- [ ] Security scan: zero critical/high findings unmitigated
- [ ] Contract tests passing in Pact Broker
- [ ] Critical E2E journeys passing (including HMS device)

## 6. Defect Management

| Severity | Definition | Resolution SLA |
|---|---|---|
| P1 — Critical | Data loss, security vulnerability, service outage | Fix before release; no exceptions |
| P2 — High | Major feature broken, NFR breach | Fix before release |
| P3 — Medium | Feature partially broken, workaround exists | Fix in next sprint |
| P4 — Low | Minor UI issue, cosmetic | Backlog |
