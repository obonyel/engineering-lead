# Copilot Instructions — Banking Super App Engineering

## Repository Purpose

This repository contains engineering documentation, architecture decision records, design artifacts, and the GitHub Copilot agent configuration for a banking super app programme. The system spans three channels (Mobile/Web/Conversational), an Experience Layer (NCP/Kraken), a Process Layer (Kraken/Kafka/IBM), and a System Layer (Core Banking/Provider microservices).

## Engineering Agent

Use the `@senior-engineering-lead` agent for:
- Architecture decisions, design documents, and technical reviews
- Generating any EL artifact (ADR, HLD, TDD, LLD, NFR, runbooks, post-mortems, risk register)
- Saga design, event schema design, API contract scaffolding
- Security reviews, test strategy, release planning

## Architecture Principles (All Code in This Repo)

- **Three-layer separation is enforced.** Experience layer = channel adaptation. Process layer = business logic + sagas. System layer = thin CDM adapters. Logic in the wrong layer will be flagged.
- **CDM first.** All data crossing service boundaries uses the Canonical Data Model schema. No point-to-point coupling between provider systems.
- **IBM ESB is read-only.** New functionality routes through Kraken Bridge + Process APIs. No new logic in DataPower or ESB.
- **Security controls are mandatory.** TLS 1.3 in transit, AES-256 at rest, OAuth 2.0/PKCE for all external APIs, mTLS for service-to-service. No secrets in code — use the secrets manager reference pattern.
- **Audit trail is non-negotiable.** Every state-changing operation emits an immutable audit event. This is a regulatory requirement.
- **Agentic layer actions require full auth chain.** No LLM output triggers a financial action without OAuth scope + consent + fraud score + idempotency key validation.

## Code Standards

- Structured JSON logging with correlation IDs on every service
- Resilience4j circuit breakers on all downstream calls with explicit timeout budgets
- Idempotency keys on all payment and state-mutation API calls
- OpenAPI 3.1 spec in `.github/templates/api-contract-template.yaml` for new endpoints
- ADR required for any significant technical decision — store in `docs/decisions/`

## Mobile Platform Rules

- iOS + Android + Huawei HMS is the required target for all mobile features
- NCP Thin Client SDK is the only mobile-to-backend communication path — no direct process/system API calls from mobile
- Certificate pinning, root/jailbreak detection, and hardware-backed biometrics are non-negotiable

## Regulatory Context

- PoPIA (South Africa): personal data handling requires consent records; data residency is ZA
- PCI-DSS: card data stays inside PCI-scoped components only; WebView scripts must have integrity checks per PCI DSS 6.4.3
- NCA and FSCA: credit and investment product rules apply to LENDING and INVEST provider systems

## Engineering Lead Playbook

The EL playbook is in `docs/playbook/` (start at `docs/playbook/README.md`). It defines roles (BA, PO, Dev Lead, Tech Lead, Integration Architect, Frontend Architect and supporting roles), who to align with per engagement type (greenfield, brownfield, bluefield, migration, provider onboarding, etc.), lifecycle gates, cloud resource design guidance, and checklists. Follow its principle: involve stakeholders before introducing a new pattern, and understand existing patterns before changing them.

## Artifact Templates

All EL artifact templates are in `.github/templates/`. Architecture decisions go in `docs/decisions/`.
