---
applyTo: "**/*.md,**/*.yaml,**/*.yml,**/*.json"
---

# Architecture Standards

## Layer Discipline

Code and configuration must respect the three-layer separation:

**Experience Layer** — NCP BE, Kraken Experience APIs, MARTECH, Agentic:
- Contains: channel-specific aggregation, BFF response shaping, protocol translation (REST/GraphQL to downstream), UI permission rules, real-time event routing
- Must NOT contain: business rules, financial calculations, product eligibility logic, saga state

**Process Layer** — Kraken Process APIs, Bridge, Kafka:
- Contains: business logic, sagas, CDM-normalized data models, domain handlers, workflow state, back pressure controls
- Must NOT contain: channel-specific formatting, mobile/web-specific payload shapes, SignalR connection management

**System Layer** — Provider microservices, Core Banking, Security stack:
- Contains: CDM adapters, system-of-record integration, security enforcement (AZP, EFP, ENTERSEKT)
- Must NOT contain: orchestration logic, channel concerns, cross-provider data joins

## Canonical Data Model Compliance

All data crossing service boundaries must use CDM types. When writing OpenAPI specs or Avro schemas:
- Reference shared CDM types from the schema registry
- Never expose internal system schemas (Temenos T24 field names, COBOL copybook structures) outside the System layer adapter
- CDM schema changes require: backward compatibility validation + Schema Registry PR + 2-sprint notice to consumers

## API Design Standards

- Version all APIs at the URL path level: `/v1/`, `/v2/`
- OpenAPI 3.1 spec must exist before implementation begins — spec-first development
- All external APIs (IBM API Connect / Open Banking) require OAuth 2.0 with PKCE
- All service-to-service calls require mTLS
- Idempotency keys (`X-Idempotency-Key: uuid`) required on all payment and state-mutation endpoints
- Error responses follow RFC 9457 Problem Details: `type`, `title`, `status`, `detail`, `instance`

## Saga and Event Design

- Kafka topic naming: `{domain}.{entity}.{event}` — e.g., `payments.transfer.initiated`
- Avro schemas registered in Confluent Schema Registry before any producer is deployed
- Every saga participant must be idempotent — check idempotency key against Redis/DB before processing
- Compensating transactions must be declared in the saga design before implementation begins
- Dead-letter topics: `{original-topic}.dlq` with mandatory alerting

## ADR Requirements

An Architecture Decision Record (ADR) in `docs/decisions/` is required before implementing:
- Any new external dependency or third-party service
- Any technology choice that creates lock-in (cloud provider, message broker, database)
- Any deviation from these architecture standards
- Any decision affecting PCI scope, PoPIA compliance, or FSCA licensing

Use the template at `.github/templates/adr-template.md`.

## Observability Standards

- Structured JSON logging with fields: `timestamp`, `level`, `service`, `correlationId`, `traceId`, `spanId`, `message`
- Distributed tracing (OpenTelemetry) on all inter-service calls
- RED metrics (Rate, Errors, Duration) for every service endpoint
- SLO dashboards required before any service goes to production
- Alert → runbook linkage: every alert must have a runbook in `.github/templates/runbook-template.md` format
