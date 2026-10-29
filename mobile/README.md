# Sahara Mzansi — Android Mobile Channel (`mobile/`)

The **Android-only** React Native (Expo) mobile application for **Sahara Mzansi** — delivering native onboarding, the consolidated wealth dashboard, real-time AG-UI Generative UI cards, and hardware-backed `BiometricPrompt` Human-in-the-Loop (HITL) payment clearance.

- **Architecture:** [Frontend Architecture](../docs/architecture/frontend-architecture.md) · [High-Level Design](../docs/architecture/agentic-demo-hld.md)
- **Visual Spec:** [Sahara Mzansi 8-Screen Stitch Specification](../docs/designs/sahara-mzansi/README.md)
- **Governing ADRs:** [ADR-001 (Android-Only Expo)](../docs/decisions/ADR-001-target-android-only-expo-channel.md) · [ADR-002 (CopilotKit React Native Headless & AG-UI)](../docs/decisions/ADR-002-adopt-copilotkit-react-native-headless-and-ag-ui.md) · [ADR-005 (Biometric HITL & FinOps Cap)](../docs/decisions/ADR-005-enforce-biometric-hitl-and-twenty-dollar-finops-cap.md)

---

## 1. Non-Negotiable CopilotKit React Native Rules

Before editing or scaffolding code in `mobile/`, enforce these three architectural invariants ([ADR-002](../docs/decisions/ADR-002-adopt-copilotkit-react-native-headless-and-ag-ui.md)):

### Rule 1 — Hermes CSPRNG Entrypoint Order (`mobile/index.js`)
React Native's Hermes engine lacks `crypto.getRandomValues` out of the box. If `@copilotkit/react-native/polyfills` loads first, it permanently falls back to `Math.random()`. **`mobile/index.js` MUST load `react-native-get-random-values` on Line 1:**

```javascript
// Line 1 — MUST load before @copilotkit/react-native/polyfills
import "react-native-get-random-values";
// Line 2 — CopilotKit polyfills (EventTarget, TextEncoder/TextDecoder,ReadableStream)
import "@copilotkit/react-native/polyfills";

import "expo-router/entry";
```

### Rule 2 — Always Import from `@copilotkit/react-native/headless`
Never import from the root `@copilotkit/react-native` barrel. The root entry pulls in optional attachment hooks (`useAttachments`) that break Metro bundling with `Unable to resolve module expo-document-picker`.

```tsx
// CORRECT
import {
  CopilotKitProvider,
  useRenderTool,
  useFrontendTool,
  ToolCallStatus,
} from "@copilotkit/react-native/headless";
```

### Rule 3 — Android Emulator Loopback (`10.0.2.2`) & TLS
- **Android Emulator:** `localhost` inside the Android VM refers to the phone itself, not your host machine. Point `EXPO_PUBLIC_COPILOT_RUNTIME_URL` to `http://10.0.2.2:8200/api/copilotkit` and `EXPO_PUBLIC_API_BASE_URL` to `http://10.0.2.2:8000/v1`.
- **Physical Android Device (USB / LAN):** Use `adb reverse tcp:8200 tcp:8200 && adb reverse tcp:8000 tcp:8000` (with `localhost`) or your Mac's LAN IP (`http://192.168.x.x:8200/api/copilotkit`, allowed only in `debug` Android network security config).
- **Cloud Run Production:** Strictly HTTPS TLS 1.3 via Cloudflare Edge.

---

## 2. Screen & Native GenUI Component Map

| Stitch Screen | Route / Surface | Native Primitives / `useRenderTool` Hooks |
|---|---|---|
| **01 — Welcome & Mobile Auth** | `app/(auth)/welcome.tsx` | `+27` phone/email OTP & OAuth sign-in via Supabase Auth + `expo-secure-store` |
| **02 — FICA & Biometrics** | `app/(onboarding)/fica.tsx` | 13-digit SA ID input (Luhn + DOB check), POPIA consent toggle, `expo-local-authentication` enrollment |
| **03 — Card & PayShap Setup** | `app/(onboarding)/setup.tsx` | Tokenized virtual card (`last4` only), `@sahara.shap` proxy handle, opening simulated deposit |
| **04 — Super App Dashboard** | `app/(tabs)/index.tsx` | Consolidated ZAR Net Worth, Mzansi Agent Fleet cards (*Jabu*, *Kagiso*, *Thabo*), Smart Wealth Vaults |
| **05 — Intent & Recipient** | `RecipientResolutionCard` | Rendered natively via `useRenderTool("resolveRecipient")` + rail fee comparison (`PayShap R0` vs `EFT R50`) |
| **06 — Transfer Synthesis** | `InteractiveTransferCard` | Rendered via `useRenderTool("stageTransfer")` with native slider, Safe Float Buffer badge & budget bar |
| **07 — HITL Clearance Gate** | `BiometricClearanceGate` | Paused `useFrontendTool` / HITL handler invoking Android `BiometricPrompt` before calling `POST /v1/approvals/{id}/confirm` |
| **08 — Settlement & Receipt** | `PayShapReceiptCard` | Rendered after confirmed ledger commit with WhatsApp share sheet & updated wealth simulations |

---

## 3. Planned Directory Structure (Phase 2 Scaffold)

```text
mobile/
├── index.js                      # Line 1 CSPRNG + Line 2 CopilotKit polyfills
├── app.json                      # Android-only Expo config (package: za.co.saharamzansi.app)
├── package.json                  # Expo SDK + @copilotkit/react-native + expo-local-authentication
├── tsconfig.json                 # TypeScript strict mode
└── src/
    ├── app/                      # Expo Router screens ((auth), (onboarding), (tabs), copilot)
    ├── components/
    │   ├── genui/                # Versioned native GenUI catalogue (v1) + UnknownComponentFallback
    │   └── ui/                   # Sahara Mzansi Warm Terracotta & Cream primitives
    ├── hooks/                    # Biometric HITL gate, Copilot telemetry & Process API hooks
    ├── lib/                      # Supabase SecureStore client, integer-cent ZAR formatters
    └── theme/                    # Sahara Mzansi color, typography & spacing tokens
```

---

## 4. Distribution (`$0/Month`)

- **Local Development:** Android Studio Emulator (API 34+) or physical Android phone via USB debugging (`npx expo run:android`).
- **Demo Testers:** **EAS Build (Free Tier)** APK artifacts distributed via **Firebase App Distribution (`$0/mo`)** — zero Apple Developer fees (`$99/yr` saved) and zero Web/PWA maintenance overhead.
