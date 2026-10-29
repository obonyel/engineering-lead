# NFR Specification: [System Name] v[X.X]

**Date:** YYYY-MM-DD
**Author:** [Name]
**Status:** `Draft` | `Approved`
**Related HLD/TDD:** [links]
**Standard:** ISO/IEC 25010:2011 quality model; TOGAF Architecture Requirements Specification

---

## 1. Performance

| Metric | Requirement | Measurement Method | SLO Breach Action |
|---|---|---|---|
| Response time (p50) | < [X]ms | APM / synthetic monitoring | Alert |
| Response time (p95) | < [Y]ms | APM | Alert |
| Response time (p99) | < [Z]ms | APM | PagerDuty P2 |
| Throughput (sustained) | [N] TPS | Load test (Gatling/k6) | Scale-out trigger |
| Throughput (burst/peak) | [M] TPS for [D] seconds | Spike test | Circuit breaker |
| Batch window | Nightly within [H] hours | Job completion monitoring | Incident |

**Performance test baseline:** [link to most recent load test results]

---

## 2. Availability and Reliability

| Attribute | Requirement | Notes |
|---|---|---|
| SLA uptime | 99.95% (< 4.4h downtime/year) | Excluding approved maintenance windows |
| MTTR (Mean Time To Recover) | < 30 minutes | From alert to service restored |
| MTBF (Mean Time Between Failures) | > [X] days | Based on historical incident data |
| RTO (Recovery Time Objective) | [X] hours | Time to restore service after disaster |
| RPO (Recovery Point Objective) | [X] hours | Maximum data loss tolerance |
| Zero-downtime deployment | Required | Blue/green or rolling deploy |
| Multi-AZ/region | Required for P0 services | Active-active or active-passive |
| Dependency failure tolerance | Fail-safe (circuit open → safe default) | No fail-open patterns |

**SADC RTGS payment window SLA:** [Specific deadline for payment submission if applicable]

---

## 3. Scalability

| Attribute | Requirement |
|---|---|
| Horizontal scaling | Stateless; scale by adding instances |
| Auto-scaling trigger | CPU > 70% sustained 3 min / Request queue depth > [N] |
| Database connection pool | Max [N] connections; pool per instance |
| Cache hit rate target | > [X]% (Redis) |
| Kafka consumer lag alert | > [N] messages for > [T] seconds |
| Max payload size | [N] KB per API request |

---

## 4. Security

| Control | Requirement |
|---|---|
| Channel authentication | OAuth 2.0 + PKCE; access token TTL ≤ 15 min |
| Service-to-service | mTLS; certificates rotated every 90 days |
| Encryption in transit | TLS 1.3 minimum; TLS 1.0/1.1 disabled |
| Encryption at rest | AES-256; HSM-managed keys (Azure Key Vault / AWS CloudHSM) |
| Key rotation | Annual; automated; zero-downtime |
| Secrets management | No secrets in code; secrets manager reference pattern only |
| PCI-DSS compliance | [Level 1 / 2 / Not in scope] — [justification] |
| PoPIA compliance | Data residency: South Africa; consent records maintained |
| Audit log retention | 7 years minimum; tamper-evident; append-only |
| Vulnerability scanning | SAST + DAST in CI/CD; critical CVEs patched within 24h |
| Penetration testing | Annual external pen test; remediation within [N] weeks |
| Step-up authentication | Hardware biometric prompt (`BiometricPrompt`) + two-phase HITL confirmation for money-moving actions |

---

## 5. Maintainability

| Attribute | Requirement |
|---|---|
| Unit test coverage | ≥ 80% line coverage; 100% for payment calculation paths |
| Integration test coverage | Key business flows covered |
| Contract test coverage | All API consumer-provider pairs |
| Cyclomatic complexity | ≤ 10 per function; ≤ 15 tolerated with justification |
| Code duplication | < 5% (SonarQube threshold) |
| DORA: Deployment frequency | [Target: weekly / daily] |
| DORA: Lead time for change | [Target: < 1 week / < 1 day] |
| DORA: MTTR | < 30 minutes |
| DORA: Change failure rate | < 5% |
| Documentation | ADR for every significant decision; runbook for every alert |

---

## 6. Observability

| Requirement | Implementation |
|---|---|
| Structured logging | JSON; fields: timestamp, level, service, correlationId, traceId, spanId, message |
| Distributed tracing | OpenTelemetry SDK; trace propagation across all service calls |
| Metrics | RED (Rate, Errors, Duration) per endpoint; exposed via Prometheus |
| SLO dashboards | Per-service dashboard before go-live |
| Alerting | PagerDuty integration; P1/P2/P3 severity tiers |
| Synthetic monitoring | [N]-second health check probes from [locations] |

---

## 7. Compliance and Regulatory

| Regulation | Applicability | Requirement |
|---|---|---|
| PoPIA (South Africa) | [Yes/No] | Consent records; data residency ZA; subject access rights |
| PCI-DSS | [In scope / Out of scope] | [Specific controls if in scope] |
| NCA | [Yes — LENDING/CARDS] | Affordability assessment before credit |
| FSCA (FAIS) | [Yes — INVEST/WEALTH] | Compliant disclosures; suitability assessment |
| SADC RTGS | [Yes — PAYMENTS] | Payment submission before [time] window |
| FICA | [Yes] | KYC completed before account/product open |

---

## 8. Portability and Interoperability

| Attribute | Requirement |
|---|---|
| Container images | OCI-compliant; no vendor-specific base images |
| API versioning | Semver; 12-month deprecation notice for breaking changes |
| Event schema | Avro in Confluent Schema Registry; backward-compatible evolution |
| Deployment | Kubernetes (cloud-agnostic manifests); Helm charts versioned |
| CDM compliance | All inter-service data uses Canonical Data Model |

---

## 9. Capacity Projections

| Metric | Current | 6-Month | 12-Month | 24-Month |
|---|---|---|---|---|
| Daily active users | [N] | [N] | [N] | [N] |
| Peak TPS | [N] | [N] | [N] | [N] |
| Storage growth/month | [N] GB | | | |
| Kafka event volume/day | [N] | | | |

**Assumptions:** [List assumptions behind projections]

---

## 10. NFR Acceptance Criteria

- [ ] Load test at target TPS for 30 minutes — p99 latency within target
- [ ] Spike test at 2× peak TPS — circuit breakers activate within [T] seconds
- [ ] Chaos test: kill one instance during load — no customer-visible error
- [ ] Chaos test: kill Kafka broker — back pressure activates, no data loss
- [ ] DR test: RTO/RPO targets met in simulated disaster scenario
- [ ] Security scan: zero critical CVEs in production artefacts
- [ ] Penetration test: no high/critical findings unmitigated before go-live
