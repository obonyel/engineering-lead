# ADR-002: Adopt `@copilotkit/react-native/headless` over AG-UI for Native Generative UI

**Date:** 2026-10-29  
**Status:** `Accepted`  
**Deciders:** Senior Engineering Lead, Mobile Architect  
**Layer:** `Channel` / `Experience`  
**FinOps Impact:** `$0/mo` (open-source MIT SDK)  
**Related ADRs:** [ADR-001](ADR-001-target-android-only-expo-channel.md), [ADR-003](ADR-003-orchestrate-agents-with-crewai-flows-gemini-and-tavily.md)  
**Related TDD/HLD:** [`docs/architecture/frontend-architecture.md`](../architecture/frontend-architecture.md)

---

## Context

Earlier workshop notes left mobile streaming transport (`SSE` vs `WebSocket` vs `polling`) and native Generative UI rendering unresolved because web DOM components do not run on React Native's Hermes engine. CopilotKit's `@copilotkit/react-native` SDK solves this natively over the **AG-UI (Agent–User Interaction)** protocol, provided two mobile-specific engineering traps are handled properly:
1. Hermes lacks Web streaming APIs and secure Web Crypto (`crypto.getRandomValues`), causing CopilotKit's polyfill to fall back permanently to insecure `Math.random` unless `react-native-get-random-values` is imported on **line 1** of `index.js`.
2. Importing the root `@copilotkit/react-native` barrel pulls `useAttachments` into Metro and breaks builds with missing `expo-document-picker` dependencies, whereas `@copilotkit/react-native/headless` has zero native dependencies.

## Decision Drivers

- Render native React Native views (`View`, `Text`, `Pressable`) styled to the Sahara Mzansi Stitch screens — never WebViews.
- Guarantee cryptographically secure UUID/nonce generation (`crypto.getRandomValues`) on Hermes.
- Avoid Metro bundler bloat and broken release APKs from unused attachment pickers.

## Decision

> **We will integrate `@copilotkit/react-native/headless` over AG-UI, enforce `import "react-native-get-random-values"` on line 1 followed by `import "@copilotkit/react-native/polyfills"` on line 2 of `mobile/index.js`, and expose a versioned native component catalogue via `useRenderTool` and `useFrontendTool`.**

## Options Considered

### Option A: `@copilotkit/react-native/headless` + AG-UI — CHOSEN
- **Pros:** Native `View`/`Text` rendering; shared AG-UI protocol with CrewAI `CopilotKitState` streaming; `useRenderTool` with `zod` schemas and `ToolCallStatus` cleanly implements Screens 5–8; zero unwanted native dependencies in Metro.
- **Cons:** Requires strict `index.js` polyfill ordering (enforced via CI check and code review).

### Option B: Root `@copilotkit/react-native` Pre-Built Components — REJECTED
- **Reason:** Pulls in native attachment dependencies (`expo-document-picker`) and uses generic chat chrome rather than Sahara Mzansi's Stitch design system.

### Option C: Custom WebSocket / Raw SSE Client — REJECTED
- **Reason:** Reinvents state delta streaming, tool-call correlation, and HITL interrupt plumbing already standardized by AG-UI.

## Consequences

- **Positive:** Solves mobile streaming, live agent progress pills, native Generative UI cards, and HITL pauses in one cohesive protocol.
- **Trade-offs:** Local Android dev requires `10.0.2.2` for emulator routing and a debug-only cleartext network exception for LAN testing; production enforces HTTPS TLS 1.3.

## Y-Statement Summary

> In the context of **rendering agentic chat and interactive banking cards on Android**, facing **Hermes Web API gaps and Metro bundling pitfalls**, we decided for **`@copilotkit/react-native/headless` over AG-UI with line-1 CSPRNG polyfills** to achieve **100% native UI fidelity and secure streaming**, accepting **strict entry-point import ordering**, because **it connects our mobile views directly to our CrewAI backend with zero WebView or bundler overhead**.
