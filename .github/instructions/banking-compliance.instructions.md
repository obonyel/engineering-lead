---
applyTo: "**/*.java,**/*.kt,**/*.ts,**/*.tsx,**/*.py,**/*.go,**/*.swift"
---

# Banking Compliance Guardrails

## PCI-DSS (Card Data Security)

- NEVER generate code that stores, logs, or transmits raw PANs (Primary Account Numbers), CVVs, or full magnetic stripe data
- Card data must only flow through explicitly PCI-scoped components — do not route card data through components outside PCI scope
- Tokenize at the point of entry; use the payment tokenization service for all card references downstream
- PCI DSS 6.4.3 (mandatory since March 2025): any JavaScript loaded in a WebView or browser payment page must be in an approved inventory with integrity hash verification
- Do not use `console.log`, debug logging, or structured log fields that could capture card data

## PoPIA (Protection of Personal Information Act — South Africa)

- All PII fields (national ID, passport, address, biometrics, financial data) require consent records before processing
- Data residency: personal data of South African residents must be processed and stored within South Africa unless explicit cross-border transfer consent exists
- Implement purpose limitation: only collect and process the minimum PII required for the declared purpose
- Provide data subject access mechanisms (view, correct, delete) for all PII stores

## Financial Regulation (NCA / FSCA)

- Credit affordability assessments are required before any credit product (LENDING, CARDS) is presented as an offer
- Investment product recommendations (INVEST, WEALTH) require FAIS compliance — do not generate personalised investment advice without FSCA-compliant disclosures
- FICA KYC requirements: customer identity verification must be complete before any account or credit product is opened

## Audit and Immutability

- Every state-changing financial operation must emit an immutable audit event with: timestamp, actor identity, action type, resource ID, before/after state hash
- Audit logs must be retained for a minimum of 7 years (South African bank regulatory requirement)
- Audit log storage must be tamper-evident — use append-only stores; no UPDATE or DELETE on audit records

## Authentication and Authorisation

- OAuth 2.0 with PKCE is required for all external API endpoints
- mTLS is required for all service-to-service calls within the platform
- Step-up authentication (OOBV via ENTERSEKT) is required for: new payee registration, transfers > R5,000, profile changes, card management actions
- Session tokens must expire: access tokens max 15 minutes, refresh tokens max 24 hours for banking sessions

## Secrets and Credentials

- Zero secrets in source code or committed configuration files
- All credentials must reference the secrets manager (Azure Key Vault / AWS Secrets Manager)
- HSM-backed keys for cryptographic signing of payment transactions
