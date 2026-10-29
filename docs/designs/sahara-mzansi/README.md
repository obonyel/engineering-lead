# Sahara Mzansi — Android UI/UX Design Specification

Source Stitch Project: `thatguycodes` (`14435926864232457007`)  
Target Channel: **Android Only** (`React Native` via `Expo` + `@copilotkit/react-native/headless`)

---

## 1. Visual System & Tokens ("Sahara Warm Terracotta")

| Token | Hex | Role |
|---|---|---|
| `canvas` | `#FAF6F2` | Warm cream primary screen background |
| `surface` | `#FFFFFF` | Elevated cards, input containers, sheet surfaces |
| `surface-muted` | `#F3ECE4` | Pills, unselected toggles, subtle input wells |
| `primary` | `#8F3E14` | Primary terracotta CTAs, active tabs, brand accents |
| `primary-soft` | `#FCE8DC` | Status badges, highlight washes |
| `ink` | `#1E1510` | Primary headings, balances, tabular figures |
| `ink-muted` | `#6E5D53` | Captions, secondary labels, helper copy |
| `border` | `#E8DDD2` | 1px card hairlines and dividers |
| `success` | `#0F7B4C` | Settled PayShap indicators, yield gains, active meters |
| `warning` | `#B8620A` | HITL clearance badges, DebiCheck alerts |
| `danger` | `#B91C1C` | Destructive actions, debit-order block triggers |

All currency and account balances use **tabular numerals** formatted in South African Rand (`R 248,500.00 ZAR`) from integer cents (`BIGINT`).

---

## 2. The Eight Core Android Screens

### Onboarding & Registration Flow (Screens 1–3)
| # | Screen File | Route / Component | Core Capabilities |
|---|---|---|---|
| **1** | [`screens/01_welcome_mobile_auth.png`](screens/01_welcome_mobile_auth.png) | `WelcomeAuthScreen` | Value carousel (*8.4% APY Rand Stashes*, *Debit Order Sentinel*), `+27` SA mobile / email OTP & Google sign-in |
| **2** | [`screens/02_fica_verification_biometrics.png`](screens/02_fica_verification_biometrics.png) | `FicaVerificationScreen` | Smart ID / Green Book / Passport selector, live 13-digit SA ID Luhn & DOB decoder, POPIA consent, biometric opt-in |
| **3** | [`screens/03_virtual_card_payshap_setup.png`](screens/03_virtual_card_payshap_setup.png) | `CardAndShapSetupScreen` | Tokenized virtual card (`last4` only), `@sahara.shap` proxy handle, opening simulated Rand deposit (`R100`–`R1,000`) |

### Post-Login Landing Page (Screen 4)
| # | Screen File | Route / Component | Core Capabilities |
|---|---|---|---|
| **4** | [`screens/04_super_app_dashboard.png`](screens/04_super_app_dashboard.png) | `SuperAppDashboardScreen` | Total Net Worth (`R248,500.00`), quick actions (`PayShap`, `EFT Send`, `Power & Air`, `FX Swap`), live **Mzansi Agent Fleet** (*Jabu*, *Kagiso*, *Thabo*), **Smart Vaults**, Virtual Card freeze/unfreeze, utility meters, recent ledger activity |

### Agentic Copilot, Financial Literacy & Biometric HITL Flow (Screens 5–8)
| # | Screen File | Native GenUI Component | Core Capabilities |
|---|---|---|---|
| **5** | [`screens/05_copilot_intent_recipient.png`](screens/05_copilot_intent_recipient.png) | `RecipientResolutionCard` | Natural-language recipient lookup (`"Mom"` $\rightarrow$ `nandi@capitec.shap`), PayShap (`R0`) vs legacy RTC (`R50` saved) literacy comparison, funding account picker |
| **6** | [`screens/06_genui_transfer_synthesis.png`](screens/06_genui_transfer_synthesis.png) | `TransferSynthesisCard` | Interactive amount presets/slider, safe daily float check (`R3,200` buffer preserved), rail selector, category budget envelope meter |
| **7** | [`screens/07_hitl_biometric_clearance.png`](screens/07_hitl_biometric_clearance.png) | `BiometricClearanceGate` | Pauses agent run (`PENDING_APPROVAL`); requires Android `BiometricPrompt` to authorize; optional bounded monthly schedule toggle (`<= R2,000/mo`, revocable anytime) |
| **8** | [`screens/08_payshap_settlement_receipt.png`](screens/08_payshap_settlement_receipt.png) | `PayShapSettlementReceipt` | Committed ledger receipt (`PSH-ZA-...`), updated grocery envelope balance, 1-tap WhatsApp proof share, 1-tap monthly payment automation rule |
