# Architecture Decision Records — Index

This directory contains all Architecture Decision Records (ADRs) for this programme.

**Format:** ADR-NNN where NNN is a zero-padded sequential number.
**Template:** `.github/templates/adr-template.md`
**Status values:** `Proposed` → `Accepted` → `Deprecated` | `Superseded by ADR-NNN`

To create a new ADR:
1. Use `@senior-engineering-lead` Copilot agent and type `/adr`
2. Copy `.github/templates/adr-template.md` to `docs/decisions/ADR-NNN-short-title.md`
3. Increment NNN from the last entry below
4. Link the ADR to its related TDD/HLD

---

## Active ADRs

| ID | Title | Status | Layer | Date |
|---|---|---|---|---|
| ADR-001 | *(first ADR goes here)* | Proposed | — | — |

---

## Superseded ADRs

| ID | Title | Superseded By | Date |
|---|---|---|---|

---

## Naming Conventions

- Use short kebab-case descriptive titles
- Examples:
  - `ADR-001-use-kafka-for-saga-choreography.md`
  - `ADR-002-select-flutter-for-mobile-shell.md`
  - `ADR-003-bridge-pattern-for-ibm-esb-mediation.md`
  - `ADR-004-entersekt-for-device-binding.md`
  - `ADR-005-hms-factory-abstraction-pattern.md`
