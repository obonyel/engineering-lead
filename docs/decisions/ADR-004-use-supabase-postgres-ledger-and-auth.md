# ADR-004: Use Supabase Postgres Double-Entry Ledger, Auth, RLS, and `pgvector`

**Date:** 2026-10-29  
**Status:** `Accepted`  
**Deciders:** Product Owner / Founder, Senior Engineering Lead  
**Layer:** `Process` / `System`  
**FinOps Impact:** `$0/mo` (Supabase Free Tier: 500 MB Postgres, 50,000 MAUs, `pgvector`, `pg_cron`)  
**Related ADRs:** [ADR-003](ADR-003-orchestrate-agents-with-crewai-flows-gemini-and-tavily.md), [ADR-005](ADR-005-enforce-biometric-hitl-and-twenty-dollar-finops-cap.md)  
**Related TDD/HLD:** [`docs/architecture/integration-architecture.md`](../architecture/integration-architecture.md)

---

## Context

A banking super-app reference cannot keep balances in browser `localStorage` or use JavaScript floating-point numbers, nor can it afford enterprise Kafka + Confluent + proprietary core-banking mainframes on a `$20/month` budget. We need real user authentication, Row-Level Security, ACID double-entry ledger transactions, vector storage for financial literacy articles, and scheduled triggers for recurring payment notifications in a single managed free-tier platform.

## Decision Drivers

- Zero-cost managed Postgres with ACID transactions, `BIGINT` integer-cent precision, and Row-Level Security.
- Built-in Auth supporting phone/email OTP and OAuth for the Screen 1 registration flow.
- Eliminate Kafka, Redis, and separate vector databases by consolidating onto Postgres (`pgvector` + `pg_cron` + append-only `audit_events`).

## Decision

> **We will use hosted Supabase (Free Tier) as the System-layer store for Auth, an integer-cent (`BIGINT`) double-entry ledger, append-only `audit_events`, `pgvector` literacy embeddings, and `pg_cron` schedules — enforcing that all financial writes flow exclusively through FastAPI Process-layer endpoints.**

## Options Considered

### Option A: Hosted Supabase Free Tier Behind Process APIs — CHOSEN
- **Pros:** `$0/mo`; combines Auth, ACID Postgres, RLS, `pgvector`, and `pg_cron` in one service; single-DB ACID transactions eliminate distributed saga coordination bugs.
- **Cons:** Free tier pauses after 7 days of zero traffic (mitigated by lightweight health ping during active demo periods).

### Option B: Self-Hosted Supabase in Local Docker — REJECTED
- **Reason:** Heavy local RAM footprint (~4–6 GB across 10+ containers) and unreachable from external Android testers when the laptop is closed.

### Option C: Direct Mobile-to-Supabase Writes — REJECTED
- **Reason:** Violates layer discipline — client writes bypass server-side safe-float checks, idempotency deduplication, and immutable audit hashing.

## Consequences

- **Positive:** One database handles auth, ledger, vectors, schedules, and audit logs cleanly at `$0/mo`.
- **Security:** `SUPABASE_SERVICE_ROLE_KEY` lives exclusively in the FastAPI Process backend; the Android app holds only `SUPABASE_ANON_KEY` + user JWT in `expo-secure-store`; `UPDATE` and `DELETE` are revoked on `audit_events` and posted `ledger_entries`.

## Y-Statement Summary

> In the context of **persisting user identity, balances, vaults, and audit trails under `$20/month`**, facing **the complexity of separate auth, DB, queue, and vector services**, we decided for **Supabase Free Tier behind FastAPI Process APIs** to achieve **ACID double-entry integrity and zero monthly DB spend**, accepting **strict server-only mutation paths**, because **Postgres natively provides ledger ACID guarantees, RLS, `pgvector`, and `pg_cron` in one platform**.
