# Release Plan: [Feature / Release Name] v[X.X]

**Date:** YYYY-MM-DD
**Release target:** YYYY-MM-DD (Sprint [N])
**Author:** [Name]
**Approvers:** Engineering Lead · Product Owner · QA Lead · InfoSec
**Related TDD/HLD:** [links]
**Feature flag:** `[flag_name]` — required: `Yes` | `No`

---

## 1. Release Summary

What is being released, to whom, and why now.

| Item | Detail |
|---|---|
| Feature/scope | [Brief description] |
| Channels affected | Android Mobile App (`Expo` / Firebase App Distribution / Play Store) |
| Users affected | [All users / Segment / Region] |
| Rollout model | Feature-flagged canary · Direct deploy · Blue/green |
| Rollback window | [N hours/days after each phase before committing] |

## 2. Pre-Release Checklist

### Engineering
- [ ] All acceptance criteria verified in staging
- [ ] Unit test coverage ≥ 80%; integration tests passing
- [ ] Performance test: NFR targets met at peak load
- [ ] Security review completed (`.github/templates/security-review-template.md`): status `Pass`
- [ ] PCI security scan: no critical/high findings
- [ ] Dependency vulnerability scan: no critical CVEs
- [ ] Runbook created for new alerts
- [ ] Feature flag configured in Flagsmith/Unleash at 0%
- [ ] Canary configuration validated in staging
- [ ] Rollback procedure tested in staging

### Mobile (Android)
- [ ] EAS Android build green; APK/AAB verified on Android Emulator & physical Android device
- [ ] Firebase App Distribution release notes and tester group ready
- [ ] Mandatory Hermes polyfill order (`react-native-get-random-values` first) verified in bundle
- [ ] `@copilotkit/react-native/headless` bundle check clean (no unresolved native dependencies)

### Data and Compliance
- [ ] Database migrations tested with rollback script
- [ ] CDM schema changes registered in Schema Registry
- [ ] Kafka topic schema backward-compatible
- [ ] PoPIA consent flows verified for new PII handling
- [ ] Audit event schema validated

### Communication
- [ ] Change advisory board (CAB) notification submitted: [link]
- [ ] Internal release notes drafted: [link]
- [ ] Customer-facing comms approved (if needed): [link]
- [ ] On-call engineer briefed on this release

## 3. Rollout Phases

### Phase 0: Dark launch / Feature flag off (deploy only)
- Deploy artifact to production with feature flag at 0%
- Monitor: deployment health, error rates, latency (baseline)
- Gate: [N hours of clean baseline] → proceed to Phase 1

### Phase 1: [N]% canary
- Enable flag for [N]% of users / [specific segment]
- Monitor for [N hours]:
  - Error rate: target < [threshold]%
  - p99 latency: target < [X]ms
  - Business metric: [e.g., payment success rate] ≥ baseline
- Gate criteria: no regressions vs. baseline → proceed to Phase 2
- Rollback trigger: error rate > [threshold]% for > [N] minutes

### Phase 2: [N]% expansion
- Enable flag for [N]% of users
- Monitor for [N hours]: same metrics as Phase 1
- Gate criteria: [metrics] → proceed to Phase 3

### Phase 3: 100% / GA
- Enable flag for all eligible users
- Monitor for [N hours]
- Mark release as stable; flag cleanup ticket created (tech debt)
- Release notes published

## 4. Rollback Procedure

**Trigger conditions:** any of the following within rollout phase:
- Error rate > [X]%
- p99 latency > [Y]ms
- Payment success rate drop > [Z]%
- Customer-facing incident raised

**Rollback steps:**
1. Set feature flag `[flag_name]` to 0% immediately — [link to flag management]
2. If flag rollback insufficient: revert deployment — `[kubectl rollout undo deployment/[name] -n [namespace]]`
3. Verify error rate returns to pre-release baseline within [N] minutes
4. Notify: Engineering Lead, Product Owner, QA Lead
5. Log rollback event in incident channel: `#releases`
6. Schedule post-rollback review within 24 hours

## 5. Monitoring and Alerts

| Alert | Threshold | Runbook |
|---|---|---|
| [Alert name] | [Threshold] | [Runbook link] |
| Error rate spike | > [X]% | [link] |
| Latency p99 breach | > [Y]ms | [link] |

**Dashboard:** [link to release monitoring dashboard]
**On-call:** [PagerDuty rotation link]

## 6. Post-Release Actions

- [ ] Confirm Phase 3 stability after [N hours]
- [ ] Feature flag cleanup ticket created: [JIRA link]
- [ ] Release retrospective scheduled: [date]
- [ ] Runbooks updated with any new scenarios observed
- [ ] ADR updated if any decisions changed during release
