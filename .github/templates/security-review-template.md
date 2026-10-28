# Security Review: [Feature / Component Name]

**Date:** YYYY-MM-DD
**Reviewer(s):** [Names]
**Component layer:** `Experience` | `Process` | `System` | `Mobile`
**PCI scope:** `In scope` | `Out of scope`
**Related TDD/HLD:** [links]
**Related ADR(s):** [ADR-NNN links]
**Status:** `Pass` | `Pass with conditions` | `Fail — remediation required`

---

## 1. Authentication and Session Management

| Control | Required | Status | Notes |
|---|---|---|---|
| OAuth 2.0 + PKCE on all external endpoints | ✅ | ⬜ Pass / ⬜ Fail | |
| mTLS on all service-to-service calls | ✅ | ⬜ | |
| Access token TTL ≤ 15 minutes | ✅ | ⬜ | |
| Refresh token TTL ≤ 24 hours (banking session) | ✅ | ⬜ | |
| Session invalidation on logout | ✅ | ⬜ | |
| Concurrent session limits enforced | ✅ | ⬜ | |
| Step-up (OOBV/ENTERSEKT) for high-risk actions | ✅ | ⬜ | Define threshold |

## 2. Authorisation

| Control | Required | Status | Notes |
|---|---|---|---|
| RBAC/ABAC enforced at every API endpoint | ✅ | ⬜ | |
| Authorization checked at each service hop (no implicit trust) | ✅ | ⬜ | |
| AZP policy for resource-level authorisation | ✅ | ⬜ | |
| Consent record checked before PII access | ✅ | ⬜ | PoPIA |
| OAuth scope matches data accessed | ✅ | ⬜ | Least-privilege |

## 3. Data Security

| Control | Required | Status | Notes |
|---|---|---|---|
| TLS 1.3 for all data in transit | ✅ | ⬜ | TLS 1.0/1.1 disabled |
| AES-256 for data at rest | ✅ | ⬜ | |
| HSM-backed keys for cryptographic signing | ✅ for payments | ⬜ | |
| Key rotation: annual automated, zero-downtime | ✅ | ⬜ | |
| PII fields encrypted at field level (where applicable) | ✅ | ⬜ | |
| No PII or card data in logs | ✅ | ⬜ | Critical |
| No secrets in source code or config files | ✅ | ⬜ | Secrets manager ref only |
| Data residency: personal data in ZA | ✅ | ⬜ | PoPIA |

## 4. PCI-DSS Controls (complete only if in PCI scope)

| Control | PCI DSS Req | Status | Notes |
|---|---|---|---|
| Raw PAN never stored post-authorization | 3.3 | ⬜ | Tokenize at entry |
| CVV/CVC never stored | 3.2.1 | ⬜ | |
| Card data does not flow through out-of-scope components | 1.3 | ⬜ | |
| WebView script inventory with integrity hashes | 6.4.3 | ⬜ | Mandatory since March 2025 |
| Payment page integrity monitoring | 11.6.1 | ⬜ | |
| Network segmentation: PCI zone isolated | 1.2 | ⬜ | |

## 5. Input Validation and Injection Prevention

| Control | OWASP | Status | Notes |
|---|---|---|---|
| All external inputs validated and sanitised | A03:2021 | ⬜ | |
| Parameterised queries / ORM only (no string concat SQL) | A03:2021 | ⬜ | |
| NoSQL injection prevention | A03:2021 | ⬜ | |
| XML/JSON schema validation on all inbound events | A03:2021 | ⬜ | |
| File upload validation (type + size + malware scan) | A05:2021 | ⬜ | |
| Output encoding to prevent XSS | A03:2021 | ⬜ | |
| HTTP security headers (CSP, HSTS, X-Frame-Options) | A05:2021 | ⬜ | |

## 6. Audit Trail

| Control | Required | Status | Notes |
|---|---|---|---|
| Immutable audit event on every state change | ✅ | ⬜ | Append-only Kafka topic |
| Audit fields: timestamp, actor, action, resource, before/after hash | ✅ | ⬜ | |
| Audit log retention: 7 years | ✅ | ⬜ | Regulatory minimum |
| Tamper-evident storage (no UPDATE/DELETE on audit records) | ✅ | ⬜ | |
| ELK/GRFS integration for forensic search | ✅ | ⬜ | |

## 7. Mobile Security (complete for mobile-facing features)

| Control | Required | Status | Notes |
|---|---|---|---|
| Certificate pinning (SPKI hash + backup pin) | ✅ | ⬜ | |
| Root/jailbreak detection → risk engine signal | ✅ | ⬜ | Do not silently block |
| Biometric keys hardware-backed (Secure Enclave/StrongBox/HMS FIDO) | ✅ | ⬜ | |
| Private keys non-exportable | ✅ | ⬜ | |
| WebView JS bridge access restricted to approved URLs | ✅ | ⬜ | |
| Deep link parameters validated server-side | ✅ | ⬜ | |
| ENTERSEKT device binding before transaction capability | ✅ | ⬜ | |
| App runs on HMS Safety Detect on Huawei devices | ✅ | ⬜ | GMS Play Integrity equivalent |

## 8. Agentic / LLM Controls (complete if Agentic layer is involved)

| Control | Required | Status | Notes |
|---|---|---|---|
| MCP tool calls pass full auth chain (not LLM-authorized alone) | ✅ | ⬜ | |
| OAuth scope + consent validated before agentic action | ✅ | ⬜ | |
| Idempotency key on all agentic-initiated mutations | ✅ | ⬜ | |
| Prompt injection vectors in RAG sources mitigated | ✅ | ⬜ | Input sanitisation |
| LLM output rate-limited and monitored | ✅ | ⬜ | |
| No financial facts generated without retrieval grounding | ✅ | ⬜ | No hallucinated rates/balances |
| Audit event on every agentic action | ✅ | ⬜ | |

## 9. Findings Summary

| Severity | Count | IDs |
|---|---|---|
| Critical | 0 | |
| High | 0 | |
| Medium | 0 | |
| Low | 0 | |
| Info | 0 | |

## 10. Conditions and Required Actions Before Go-Live

| ID | Finding | Severity | Required Action | Owner | Due |
|---|---|---|---|---|---|
| S001 | [Finding] | Critical/High/Medium | [Action] | [Name] | YYYY-MM-DD |
