# Engineering Lead Playbook

Operating guide for the Engineering Lead (EL) on the agentic banking super app programme (Channel / Experience / Process / System layers, Android mobile client, cloud-native backend + provider integration).

Modelled on the [Code-With Engineering Playbook](https://microsoft.github.io/code-with-engineering-playbook/design/design-patterns/cloud-resource-design-guidance/). That page boils down to one principle, which this playbook generalises from cloud resources to everything the EL decides:

> **Involve the relevant stakeholders before introducing a new pattern, and understand the existing patterns in an established environment before changing them.**

## Contents

| # | Document | Use it when |
|---|----------|-------------|
| 1 | [Roles and responsibilities](01-roles.md) | You need to know who owns what, and what the EL expects from each role |
| 2 | [Alignment by engagement type](02-alignment-by-context.md) | Greenfield, brownfield, bluefield, migration, provider onboarding: who do I align with first? |
| 3 | [Engagement lifecycle and gates](03-lifecycle-and-gates.md) | Planning the phases, artifacts and decision gates |
| 4 | [Cloud resource design guidance](04-cloud-resource-design.md) | Subscriptions, management groups, naming, tagging, environments |
| 5 | [Checklists](05-checklists.md) | Day-to-day: kickoff, design review, go-live, handover |

## EL mandate in one paragraph

The EL is accountable for **technical delivery outcomes**: the right thing is built (with BA/PO), built soundly (with Tech Lead and architects), shipped safely (with DevOps/Security/Risk), and operable afterwards. The EL does not own the backlog (PO), requirements (BA), or detailed design (Tech Lead/architects), but **owns the alignment between them** and escalates when they diverge.

## Conventions

- **R/A/C/I**: Responsible, Accountable, Consulted, Informed. One **A** per decision.
- **Decision record**: anything that changes a pattern, a contract, or an environment gets an ADR (`.github/templates/adr-template.md`, index in `docs/decisions/ADR-000-index.md`).
- Artifacts reference templates in `.github/templates/`.
- Names of roles are generic. Map them to named people in the stakeholder register at kickoff (Checklist 5.1).
