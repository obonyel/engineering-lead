# ADR-001: Target Android-Only Mobile Channel via React Native (Expo) and Descope Web

**Date:** 2026-10-29  
**Status:** `Accepted`  
**Deciders:** Product Owner / Founder, Senior Engineering Lead  
**Layer:** `Channel`  
**FinOps Impact:** `$0/mo` (eliminates `$99/yr` Apple Developer fee and multi-channel build overhead)  
**Related ADRs:** [ADR-002](ADR-002-adopt-copilotkit-react-native-headless-and-ag-ui.md), [ADR-005](ADR-005-enforce-biometric-hitl-and-twenty-dollar-finops-cap.md)  
**Related TDD/HLD:** [`docs/architecture/agentic-demo-hld.md`](../architecture/agentic-demo-hld.md), [`docs/architecture/frontend-architecture.md`](../architecture/frontend-architecture.md)

---

## Context

The repository previously mixed four conflicting client targets: a Next.js e-commerce web demo, a bare React Native CLI brownfield stub, architecture templates assuming Flutter + tri-platform app stores, and documentation claiming iOS builds. Meanwhile, the Sahara Mzansi demo requires authentic mobile banking UI/UX (matching the 8 mobile Stitch screens in [`docs/designs/sahara-mzansi/`](../designs/sahara-mzansi/README.md)), hardware biometric clearance, and a strict `<= $20/month` total budget.

## Decision Drivers

- Authentic native mobile UI/UX is mandatory for the banking super-app demo (PWA/Web is rejected).
- Zero recurring app-store licensing taxes (`$0/mo` distribution via APK / Firebase App Distribution).
- Eliminate maintenance of duplicate client codebases (Web, iOS Xcode/Pods, and secondary mobile app stores).

## Decision

> **We will build exclusively for Android using React Native with Expo (`mobile/`), distribute builds via EAS Free Tier and Firebase App Distribution, and explicitly descope Web, iOS, and secondary mobile app stores.**

## Options Considered

### Option A: Android-Only React Native via Expo — CHOSEN
- **Pros:** Native mobile UX (`View`, `Text`, Android `BiometricPrompt`); `$0` distribution via Firebase App Distribution or direct APK; works directly with `@copilotkit/react-native/headless`; single client codebase in TypeScript.
- **Cons:** iOS users cannot install a native binary without future Apple Developer enrollment (`$99/yr`).
- **Reason for selection:** Delivers 100% of the mobile UX requirement at `$0` platform cost with minimum build friction.

### Option B: Progressive Web App (Next.js) — REJECTED
- **Reason:** Rejected by Product Owner because the demo requires native mobile app UI/UX and Android hardware biometrics rather than a browser container.

### Option C: Tri-Platform Mobile (iOS + Android + Secondary App Stores) — REJECTED
- **Reason:** Triples native build/testing complexity and incurs Apple's `$99/yr` developer fee with zero added value for the reference demo.

## Consequences

- **Positive:** Legacy web and bare-CLI mobile stubs are removed; 100% of UI effort focuses on the 8 Sahara Mzansi Android screens.
- **Trade-offs:** Android Emulator (`10.0.2.2`) or an Android device is required to run the client.
- **Technical debt impact:** Reduces significant multi-channel debt.

## Y-Statement Summary

> In the context of **delivering the Sahara Mzansi mobile super-app demo**, facing **a strict `<= $20/month` budget and a requirement for true mobile UI/UX**, we decided for **an Android-only React Native (Expo) channel** to achieve **native UX, hardware biometrics, and `$0` distribution**, accepting **no iOS/Web client in v1**, because **focusing on one mobile OS eliminates multi-platform bloat and app-store fees**.
