# Integration Architecture

**Pillar page — one of two equal pillars in this standard. See also
[Frontend Architecture](frontend-architecture.md).**

This page defines how services, channels, and systems integrate under this standard: the
layer model, the asynchronous event fabric, distributed-transaction patterns, the
canonical data contract, and the authorization chain that keeps an agentic layer safe in a
regulated domain. The full stack is encoded in the
[senior-engineering-lead agent](../../.github/agents/senior-engineering-lead.agent.md) and
enforced by the
[architecture standards](../../.github/instructions/architecture-standards.instructions.md);
this page is the human-readable rationale.

---

## Principles

1. **Three layers, strictly separated.** Experience = channel adaptation. Process =
   business logic, sagas, and the canonical model. System = thin adapters to systems of
   record. Logic in the wrong layer is a defect.
2. **The Canonical Data Model is law.** Everything crossing a service boundary speaks CDM.
   No consumer knows a provider's internal schema; no point-to-point coupling between
   providers.
3. **Legacy integration is read-only.** New capability routes through an anti-corruption
   **Bridge** and the Process layer — never by adding logic to the legacy ESB.
4. **Every state change is idempotent and audited.** Idempotency keys on all
   state-mutation calls; an immutable audit event on every state-changing operation.
5. **The agentic layer is not self-authorizing.** An LLM tool call carries no privilege of
   its own; it traverses the same authorization chain as any other caller.
6. **Decisions are executable and recorded.** New dependencies, lock-in choices, and any
   deviation from these standards require an [ADR](../decisions/ADR-000-index.md) before
   implementation.

---

## The three layers

| Layer | Contains | Must not contain |
|---|---|---|
| **Experience** | Channel aggregation, BFF shaping, protocol translation, UI permissions, real-time event routing | Business rules, financial calculations, eligibility logic, saga state |
| **Process** | Business logic, sagas, CDM models, domain handlers, workflow state, back-pressure | Channel-specific formatting, mobile/web payload shapes, connection management |
| **System** | CDM adapters, system-of-record integration, security enforcement | Orchestration, channel concerns, cross-provider joins |

The agentic and frontend concerns live in the **Experience** layer — which is why the
[frontend pillar](frontend-architecture.md) insists the model only *proposes*, and all
business validation happens deeper, in Process.

---

## The dual asynchronous pipeline

A channel-to-backend interaction takes one of two transport paths, chosen explicitly per
feature rather than defaulting to REST:

```
Channel (SDK)
      |
  API Gateway        TLS termination, OAuth 2.0 verification, routing, rate limiting
      |
 Channel Adapter     translates CloudEvents AND REST to/from CDM; dedupes by event id
      |
   ROUTER            inspects message type + device state
    /      \
Secure      HTTP Secure
Pipeline    Pipeline
(async)     (hybrid)
    |            |
WebSocket     Handler / Saga
+ Push            |
    |         Process APIs
 Kafka  <——————>  Kafka
```

**Secure pipeline (async CloudEvents)** — payment status streaming, offer/NBA delivery,
fraud alerts, and any saga whose interim status should reach the device. Delivery is over
a persistent WebSocket when the app is foregrounded, with push (FCM / APNs / HMS Push Kit)
as the background fallback.

**HTTP Secure pipeline (hybrid)** — balance queries, catalogue reads, auth flows, and any
operation where the client expects an immediate synchronous response, or where the
WebSocket is unavailable.

### Trade-offs

| Dimension | Secure (async) | HTTP (hybrid) |
|---|---|---|
| Latency to first response | Higher (event round-trip) | Lower (direct response) |
| Client complexity | Higher (WebSocket lifecycle + correlation) | Lower (standard HTTP) |
| Server scalability | Better (stateless producers; state in Redis) | Standard |
| Debuggability | Harder (causal chain across events) | Easier (one request/response trace) |
| Offline / background | Native (push fallback) | Needs polling or push wrapper |
| Audit trail | Excellent (every event immutable in Kafka) | Good (request/response logged) |

Picking a path is an explicit, recorded decision — see the async pre-design questions in
the [agent definition](../../.github/agents/senior-engineering-lead.agent.md).

---

## CloudEvents: envelope and causality

Every message on the async pipeline conforms to the CNCF CloudEvents v1.0 envelope:

| Field | Role |
|---|---|
| `id` | Globally unique per event; the Channel Adapter uses it for **idempotency deduplication** — a retried send is a no-op |
| `type` | `{org}.{domain}.{entity}.{verb}`, e.g. `za.co.bank.payments.transfer.initiate` |
| `correlationid` | Set on the originating command; carried by every downstream event so the client can match responses to commands |
| `causationid` | Set to the `id` of the event that directly caused this one — enables causal-chain tracing without a central orchestrator |

**Errors are events, not HTTP codes.** On the async path, failures arrive as typed events
— `*.rejected` (validation), `*.failed` (business rule), `*.compensated` (saga rollback),
`*.timed_out`, `*.error` — delivered back over the pipeline. A client must never assume
success after sending a command; it subscribes to the response type and handles each
failure variant. This is the integration contract behind the frontend's
"[design for agentic failure](frontend-architecture.md#designing-for-agentic-failure)".

**Replay.** On reconnect, the client sends `session.resume` with its last `correlationid`;
the backend replays missed events in order (default window 30 min; payment-critical 24 h),
backed by Redis Streams for short-lived replay and Kafka compaction for durable recovery.

---

## Distributed transactions: sagas

Multi-step operations that span services use sagas, with compensation declared **before**
implementation.

| | Orchestration | Choreography |
|---|---|---|
| Coordinator | Explicit | None — Kafka event chain |
| Best for | Complex compensation; 3+ services; regulatory audit required | High-throughput, loosely-coupled, simple chains |
| Examples | Loan origination, FX transfer, account opening | Balance-update notification, statement trigger |
| Visibility | Central, easy to reason about | Emergent; needs distributed tracing |

Hybrid is valid; the choice is recorded in an ADR. Every saga participant is **idempotent**
(checks its key before processing), and every failure path has a declared compensating
transaction and a dead-letter topic (`{original-topic}.dlq`) with mandatory alerting.

---

## Canonical Data Model & the anti-corruption Bridge

- **CDM** is the single cross-system schema. Each provider has exactly one CDM adapter in
  the System layer; internal schemas never escape it. CDM changes require backward-
  compatibility validation, a Schema Registry PR, and advance notice to consumers.
- **The Bridge** is the anti-corruption layer over legacy integration (IBM ESB /
  DataPower): it owns JSON↔SOAP/XML translation and protocol mediation so modern services
  never learn SOAP/MQ internals, and the legacy fabric gains no new business logic. All new
  capability routes through Bridge + Process APIs.
- **Kafka** is the durable backbone: event log, the Outbox pattern for reliable publish,
  the choreography bus, and a Schema Registry (Avro) that enforces CDM. Topic naming:
  `{domain}.{entity}.{event}`.

---

## The agentic authorization chain

The integration-critical rule for an agentic product: **an LLM tool call is just another
caller.** Every agent-triggered action that changes state must traverse, in order:

```
OAuth scope validation → consent record check → fraud risk score
    → idempotency-key deduplication → execute → immutable audit event
```

No step may be skipped on the grounds that "the model decided." The frontend's
human-in-the-loop approval ([frontend pillar](frontend-architecture.md)) sits *in front
of* this chain for consequential actions; the chain itself is the backend guarantee. The
MCP server that exposes banking tools to agents enforces OAuth 2.1 + PKCE on every call.

---

## Resilience, observability & audit

- **Resilience:** circuit breakers (Resilience4j) with explicit timeout budgets on every
  downstream call, bounded queues, consumer throttling, and dead-letter queues for
  reconciliation.
- **API contract:** URL-path versioning (`/v1/`), spec-first OpenAPI 3.1, mTLS
  service-to-service, OAuth 2.0 + PKCE for external APIs, idempotency keys on all
  state-mutation endpoints, RFC 9457 Problem Details for errors.
- **Observability:** structured JSON logs carrying `correlationId` / `traceId` / `spanId`,
  OpenTelemetry tracing across every hop, RED metrics per endpoint, SLO dashboards before
  production, and an alert→runbook link for every alert.
- **Audit:** every state-changing operation emits an immutable audit event — a regulatory
  requirement, and the reason the async pipeline's Kafka log is a first-class asset.

---

## Reference map

| Concern | Source |
|---|---|
| Full encoded stack, pipelines, sagas, auth chain | [`senior-engineering-lead.agent.md`](../../.github/agents/senior-engineering-lead.agent.md) |
| Mobile / tri-platform integration | [`mobile-architect.agent.md`](../../.github/agents/mobile-architect.agent.md) |
| Layer, CDM, API, saga, observability rules | [`architecture-standards.instructions.md`](../../.github/instructions/architecture-standards.instructions.md) |
| Regulated-domain guardrails | [`banking-compliance.instructions.md`](../../.github/instructions/banking-compliance.instructions.md) |
| API contract template (OpenAPI 3.1) | [`.github/templates/api-contract-template.yaml`](../../.github/templates/api-contract-template.yaml) |
| Decisions | [`docs/decisions/`](../decisions/ADR-000-index.md) |

---

## Open decisions (ADRs to write)

- **New external dependency** (e.g. the data/auth backing store for the agentic reference) —
  required before adoption per the standards.
- **Pipeline path** for each new channel feature — async CloudEvents vs HTTP hybrid.
- **Saga style** per domain flow — orchestration vs choreography.

See the [workshop notes](agentic-app-workshop-notes.md) and the
[ADR index](../decisions/ADR-000-index.md).
