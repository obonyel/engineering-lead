# Mobile Channel & Agentic UI Architecture

**Pillar page — one of two equal pillars in this standard. See also [Integration Architecture](integration-architecture.md).**

This page defines how the **Sahara Mzansi** Android mobile client is architected: how an in-app AI copilot connects over **AG-UI**, renders **native Generative UI** without WebViews, synchronizes real-time `CrewAI` workflow state, and enforces **hardware biometric Human-in-the-Loop (HITL)** clearance before any money moves.

Visual reference: [`docs/designs/sahara-mzansi/README.md`](../designs/sahara-mzansi/README.md) (8 Stitch mobile screens).  
Governing ADRs: [ADR-001](../decisions/ADR-001-target-android-only-expo-channel.md), [ADR-002](../decisions/ADR-002-adopt-copilotkit-react-native-headless-and-ag-ui.md), [ADR-005](../decisions/ADR-005-enforce-biometric-hitl-and-twenty-dollar-finops-cap.md).

---

## 1. Core Principles

1. **Android-Only Native Focus:** We target Android exclusively via **React Native + Expo** (`mobile/`). Web/PWA, iOS, and secondary mobile app stores are descoped so every component renders into native Android primitives (`View`, `Text`, `Pressable`, `BiometricPrompt`) with `$0` distribution fees.
2. **Experience Layer Discipline:** The mobile app and its agent hooks hold **zero business rules or financial math**. All balances arrive as integer cents from the Process API, and every write goes through validated `/v1/*` endpoints.
3. **Tools & Staged Proposals Are the Only Path to Action:** The agent reads sanitized screen context and invokes typed tools. Consequential tools **stage** a `PENDING_APPROVAL` record and pause — a model can never approve or execute a transfer on the user's behalf.
4. **Versioned Native Component Catalogue:** Because React DOM does not exist on React Native, generative UI works by mapping typed tool calls (`useRenderTool`) to a curated, versioned catalogue of native Sahara Mzansi cards sharing one design-token contract.
5. **Server Is the Single Source of Truth:** Supabase Postgres (via FastAPI Process endpoints) owns accounts, vaults, beneficiaries, staged approvals, and ledger entries. The mobile app caches server state with explicit loading, retry, and error states.

---

## 2. `@copilotkit/react-native/headless` & Hermes Setup

Integrating AG-UI streaming into React Native on Hermes requires two strict architectural rules ([ADR-002](../decisions/ADR-002-adopt-copilotkit-react-native-headless-and-ag-ui.md)):

### 2.1 Entry-Point Polyfill Ordering (`mobile/index.js`)
Hermes omits Web streaming APIs (`ReadableStream`, `TextEncoder`) and Web Crypto (`crypto.getRandomValues`). CopilotKit's polyfill falls back permanently to insecure `Math.random` unless a native CSPRNG claims `crypto.getRandomValues` first:

```ts
// mobile/index.js — ORDER IS SECURITY-CRITICAL
import "react-native-get-random-values"; // Line 1: native Android CSPRNG claims crypto.getRandomValues
import "@copilotkit/react-native/polyfills"; // Line 2: streaming & encoding polyfills for AG-UI
import { registerRootComponent } from "expo";
import App from "./src/App";

registerRootComponent(App);
```

### 2.2 Headless Import Surface Only
Metro bundles every dependency reachable from an entry barrel. Importing the root `@copilotkit/react-native` barrel pulls in `useAttachments` and breaks release builds with `Unable to resolve module expo-document-picker`.
- **Rule:** Import exclusively from `@copilotkit/react-native/headless` (`CopilotKitProvider`, `useRenderTool`, `useFrontendTool`, `ToolCallStatus`, state/context hooks).
- **Benefit:** Zero unwanted native dependencies and 100% visual alignment with Sahara Mzansi's Stitch screens.

### 2.3 Android Runtime Connectivity
- **Android Emulator:** Connects to local Docker backend via `http://10.0.2.2:8200/api/copilotkit` and `http://10.0.2.2:8000/v1`.
- **Physical Android Device:** Uses debug-only cleartext LAN routing during local development and enforces `https://` (TLS 1.3 via Cloudflare $\rightarrow$ Cloud Run) in staging/production builds.

---

## 3. End-to-End Mobile Screen & Generative UI Map

The Android app implements the 8 **Sahara Mzansi** screens (`docs/designs/sahara-mzansi/`):

### 3.1 Registration & Post-Login Landing Flow (Screens 1–4)
1. **Screen 1 — `WelcomeAuthScreen`:** Value carousel (*8.4% APY Rand Stashes*, *Debit Order Sentinel*), `+27` mobile / email OTP & Google sign-in via Supabase Auth.
2. **Screen 2 — `FicaVerificationScreen`:** Smart ID / Green Book / Passport selector, live 13-digit SA ID check-digit & DOB preview (verified server-side), POPIA consent capture, and Android biometric opt-in.
3. **Screen 3 — `CardAndShapSetupScreen`:** Tokenized Platinum virtual card activation (`last4` only), `@sahara.shap` proxy ID registration, and opening simulated Rand deposit (`R100`–`R1,000`).
4. **Screen 4 — `SuperAppDashboardScreen` (Landing Page):** Consolidated Net Worth (`R248,500.00`), quick rail triggers (`PayShap`, `EFT Send`, `Power & Air`, `FX Swap`), live **Mzansi Agent Fleet** cards (*Jabu*, *Kagiso*, *Thabo*), **Smart Vaults** progress, Virtual Card quick-freeze, utility meters, and recent ledger activity.

### 3.2 Native Generative UI Catalogue (`useRenderTool` — Screens 5–8)

```tsx
import { ToolCallStatus, useRenderTool } from "@copilotkit/react-native/headless";
import { z } from "zod";

useRenderTool({
  name: "renderTransferSynthesis",
  description: "Render interactive PayShap vs EFT transfer synthesis card with safe-float check.",
  parameters: z.object({
    approvalId: z.string().uuid(),
    recipientName: z.string(),
    shapId: z.string(),
    amountCents: z.number().int().positive(),
    safeFloatRemainingCents: z.number().int(),
    budgetUsedPct: z.number(),
  }),
  render: ({ args, status }) => (
    <TransferSynthesisCard
      data={args}
      pending={status !== ToolCallStatus.Complete}
    />
  ),
});
```

| Catalogue Component (`v1`) | Stitch Ref | Triggered By | UX Behaviour |
|---|---|---|---|
| `AgentProgressPill` | Screens 5–8 | `CrewAI` `copilotkit_emit_state` (`canvas_logs`) | Live status banner (*"Checking R3,200 float buffer..."*, *"Verifying SARB rate via Tavily..."*) |
| `RecipientResolutionCard` | Screen 5 | `resolveRecipient` | Displays matched contact (`@capitec.shap`), PayShap (`R0`) vs legacy RTC (`R50` saved) literacy badge, and funding account selector |
| `TransferSynthesisCard` | Screen 6 | `stagePayment` | Interactive amount presets, safe-float preservation note, rail comparison, and monthly budget envelope bar |
| `BiometricClearanceGate` | Screen 7 | HITL Interrupt (`PENDING_APPROVAL`) | Pauses agent flow; invokes Android `BiometricPrompt`; includes optional bounded recurring schedule toggle (`<= R2,000/mo`) |
| `PayShapSettlementReceipt` | Screen 8 | Post-confirmation resume | Displays settled PASA reference, new balance, envelope status, 1-tap WhatsApp `Share` sheet, and monthly automation toggle |
| `WealthLiteracyCard` | Copilot / Vaults | `simulateWealthGrowth` | Interactive compound yield vs SA inflation comparison with grounded source citations and FAIS educational notice |

---

## 4. Designing for Agentic Failure on Mobile

- **Never Assume Optimistic Financial Success:** Balances and receipts render only after `/v1/approvals/{id}/confirm` returns HTTP `200` with a committed ledger transaction ID.
- **Explainable RFC 9457 Errors:** If a transfer violates safe-float rules or fails validation, the Process API returns structured Problem Details so *Jabu* explains the exact reason and suggests a safe adjustment.
- **Offline / Drop Recovery:** Session tokens sit in `expo-secure-store`; every confirmation carries `X-Idempotency-Key` so retrying over flaky mobile data can never double-debit the user's account.
