# Runbook: [Service Name] — [Alert Name / Incident Type]

**Alert:** [Exact alert name from monitoring platform]
**Severity:** `P1 — Critical` | `P2 — High` | `P3 — Medium`
**Service:** [Service name]
**Layer:** `Experience` | `Process` | `System`
**Owner squad:** [Squad name]
**On-call rotation:** [PagerDuty rotation link]
**Last tested:** YYYY-MM-DD
**Last updated:** YYYY-MM-DD

---

## Alert Description

What condition triggers this alert?
- Metric: [e.g., error rate > 5% over 5-minute window]
- Dashboard: [link]
- Alert query: [PromQL / log query]

## Customer / Business Impact

| Scenario | Impact |
|---|---|
| Alert fires, not yet resolved | [e.g., payments failing for [X]% of users] |
| If unresolved for 15 minutes | [Escalating impact] |
| If unresolved for 1 hour | [Severe impact / SLA breach] |

## Symptoms and Signals

What else should the responder check to confirm and scope the incident?

- [ ] Error rate spike on [dashboard link]
- [ ] Kafka consumer lag on topic `[topic]` > [threshold]
- [ ] Upstream service health: [CopilotRuntime / FastAPI Process API / Supabase / Gemini / Tavily]
- [ ] Recent deployment: check [CI/CD link] for deploys in last 2 hours
- [ ] Infrastructure events: [cloud console link]
- [ ] Correlated alerts: [related alerts that often fire together]

## Immediate Triage Steps

Perform these in order. Check the box when complete.

- [ ] 1. Confirm alert is not a false positive — verify in dashboard
- [ ] 2. Check correlationId/traceId in logs for affected requests: `[log query]`
- [ ] 3. Identify blast radius: how many users/transactions affected?
- [ ] 4. Check dependency health:
  - [ ] [Dependency A]: `curl -s https://[health-endpoint] | jq .status`
  - [ ] [Dependency B]: [check command]
- [ ] 5. Check for recent deployments in last 2 hours — candidate for rollback
- [ ] 6. Open a war-room channel: `#incident-YYYYMMDD-[service]`
- [ ] 7. Notify: post in `#incidents` with: service, impact, timestamp, severity

## Resolution Steps

### Scenario A: [Most common root cause]

1. [Step 1]
2. [Step 2]
3. [Verification: confirm resolved by checking [metric]]

### Scenario B: [Second most common cause]

1. [Step 1]
2. [Verification]

### Scenario C: Dependency failure (upstream service down)

1. Confirm dependency health via status page / ops contact
2. If Kafka lag: check consumer group lag — `kafka-consumer-groups.sh --group [group] --describe`
3. If database: check connection pool exhaustion — `[connection pool metrics link]`
4. Circuit breaker should have activated — verify degraded mode is serving cached responses where configured

## Rollback Procedure

If a recent deployment caused the issue:

1. Identify the last known good deployment: [CI/CD link]
2. Trigger rollback: [rollback command or CI/CD step]
3. Verify rollback deployed: [health check command]
4. Confirm alert resolves within [N] minutes of rollback

## Escalation Path

| Time Without Resolution | Action |
|---|---|
| 0 minutes | On-call engineer (PagerDuty) |
| 15 minutes | Squad lead notified |
| 30 minutes | Engineering Lead + Product Owner |
| 45 minutes | Head of Engineering + communications team |
| 60 minutes (P1) | Executive escalation; major incident declaration |

**External escalations:**
- Supabase status / support: https://status.supabase.com
- Google Cloud / Gemini API status: https://status.cloud.google.com
- Cloudflare status: https://www.cloudflarestatus.com

## Post-Incident Actions

- [ ] Incident resolved — close war-room channel, update status page
- [ ] Schedule post-mortem within 48 hours (P1/P2): use `/postmortem` template
- [ ] Create follow-up tickets for permanent fix and contributing factor remediation
- [ ] Update this runbook if a new scenario was encountered

## References

- Service dashboard: [link]
- Architecture: [TDD/HLD link]
- Related ADR: [ADR-NNN]
- Dependency runbooks: [links]
- Previous post-mortems: [links]
