# 4. Cloud Resource Design Guidance (EL edition)

Adapted from the Code-With Engineering Playbook page *Cloud Resource Design Guidance*. The source's message: subscription design, management groups, and naming/tagging conventions shape governance, operations and adoption, so **involve the relevant stakeholders before introducing a new pattern, and understand the existing patterns in an established environment before changing them.** The source delegates detail to the Microsoft Cloud Adoption Framework (CAF); this document adds the EL's decisions and alignment on top.

> The bank's existing landing zone, naming standard and tagging policy **take precedence** over everything below. Use this as a checklist of what to confirm, not as a replacement.

## 4.1 Rule zero

Before creating any resource:
1. Find the existing pattern (landing zone docs, Azure Policy, naming standard, IaC repos).
2. Ask Platform/DevOps, Security and FinOps: "is there already a way we do this?"
3. If you must deviate, write an ADR and get those stakeholders' agreement first.

## 4.2 Who decides what

| Decision | Accountable | Consulted | Informed |
|----------|-------------|-----------|----------|
| Management group and subscription topology | Platform / Cloud CoE | Enterprise Architect, Security, FinOps, EL | Tech Lead |
| Which subscription a workload lands in | Platform | EL, Integration Architect, Security | Dev Lead |
| Naming convention | Platform / Cloud CoE | EL, DevOps | All engineers |
| Tagging policy | Platform + FinOps | Risk (data classification), Operations | All engineers |
| Environment strategy (dev/test/prod) | EL | Platform, QA, Security, Integration Architect | PO |
| Network and connectivity (to on-prem, providers) | Network/Platform | Integration Architect, Security | EL |
| Cost budgets and alerts | FinOps / EL | PO, Platform | Delivery |
| Resource-level design (SKUs, scaling) | Tech Lead | DevOps, Integration/Frontend Architect | EL |

## 4.3 Subscriptions and management groups

Considerations to confirm with Platform:
- **Separation of production from non-production**, normally by subscription, with distinct policies and access.
- **Workload alignment:** subscriptions per workload or domain (e.g. Experience layer, Process layer, shared platform services, Security/identity) rather than one shared bucket, so cost, quota and blast radius are manageable.
- **Management group hierarchy** carries Azure Policy and RBAC down: confirm which policies apply (allowed regions for data residency, required tags, denied public endpoints).
- **Quotas and limits:** check subscription limits for expected scale (APIM, Kafka/Event Hubs throughput, AKS node counts).
- **Shared services:** API gateway, Key Vault strategy, monitoring workspace, private DNS: who owns, who consumes.

EL questions:
- Does this engagement need a new subscription, or does it fit an existing one? (Default: fit existing.)
- Where does it sit relative to external provider APIs and systems of record?
- Which data classifications will it hold, and is that allowed in the target region and subscription?

## 4.4 Environment strategy

- Standard set: dev, test/SIT, UAT/pre-prod, prod; add performance and DR as the NFRs require.
- Production is isolated; non-prod holds no real customer data (use masked or synthetic).
- Each environment must have reachable counterparts for provider systems, or stubs. Confirm provider non-prod availability in Phase 0/1.
- Infrastructure as code for every environment; no manual portal drift. Same templates, different parameters.
- Mobile: map backend environments to app build variants.

## 4.5 Naming

- Follow the CAF recommended abbreviations and pattern, as adopted by the bank. A typical shape: `<resource-abbrev>-<workload>-<environment>-<region>-<instance>`, e.g. `rg-payments-prod-saf-001`, `kv-rewards-uat-saf-001`.
- Respect per-resource constraints (length, case, allowed characters, global uniqueness for storage accounts and some others).
- Names must not contain secrets or customer data.
- Enforce through IaC modules and Azure Policy, not reviewer memory. The Azure Resource Naming Tool (linked in the source page) can help generate compliant names.

## 4.6 Tagging

Minimum tag set (align with the bank's actual policy):

| Tag | Purpose |
|-----|---------|
| `workload` / `application` | Ownership and cost allocation |
| `environment` | dev / test / uat / prod |
| `owner` (team or DL) | Who to call |
| `costcentre` | FinOps chargeback |
| `data-classification` | Drives security controls and Risk reporting |
| `criticality` | Operational tiering (RTO/RPO, on-call) |
| `engagement` / `project-code` | Traceability to programme |

Enforce with policy (require or inherit), not goodwill. Review tags in the monthly cost review.

## 4.7 Banking-specific considerations

- **Data residency and sovereignty:** confirm allowed regions; document where PII and card data live.
- **Regulatory notifications:** material cloud or outsourcing changes may need regulator notification. Ask Risk/Compliance early.
- **Segregation of duties:** no single engineer can both change and approve production resources.
- **Auditability:** activity logs retained per policy and forwarded to the bank's audit stack (ELK/forensics, per the architecture).
- **Resilience:** zone redundancy and DR per NFR tier; test failover, don't assume.
- **Secrets and keys:** managed through the approved vault with rotation; no secrets in pipelines or repos.

## 4.8 EL review checklist for cloud resources

- [ ] Existing landing-zone patterns reviewed; any deviation has an ADR
- [ ] Subscription placement agreed with Platform
- [ ] Naming and tagging enforced via IaC and policy
- [ ] Prod/non-prod separated; non-prod has no real customer data
- [ ] Data classification and residency confirmed with Risk/Data Owner
- [ ] Network path to providers and on-prem agreed with Network/Security
- [ ] Budget, cost alerts and owner set
- [ ] Diagnostics, logging and alerting wired to the standard workspace
- [ ] DR and backup match the NFR tier
- [ ] Access via RBAC groups, least privilege, break-glass documented

## 4.9 Resources

- [Code-With Engineering Playbook: Cloud Resource Design Guidance](https://microsoft.github.io/code-with-engineering-playbook/design/design-patterns/cloud-resource-design-guidance/)
- Microsoft Cloud Adoption Framework (subscription organisation, tagging, naming, resource abbreviations, dev/test/production workload organisation): follow the links from the source page.
- Azure Resource Naming Tool: linked from the source page.
