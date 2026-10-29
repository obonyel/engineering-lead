# Sahara Mzansi — Step-by-Step Developer Implementation Guide (Phases 2 to 5)

This guide explains **in plain, simple English** how to build, test, and ship **Sahara Mzansi** from **Phase 2 through Phase 5**.

You do not need to be a banking domain expert to follow this guide. Every rule is explained simply, with exact commands and file paths so you always know **what** you are building, **why** it matters, and **how to check** that it works.

---

## 0. The Big Picture in Plain English (Read This First)

Before touching code, keep these **four simple rules** in mind. If you follow these four rules, you cannot break the architecture or blow the budget:

1. **Android Only (`mobile/`):** We are only building for Android phones and the Android Emulator using React Native + Expo. Do **not** build a website, do **not** configure Xcode/iOS (saves `$99/year`), and do **not** use WebViews.
2. **Money Is Stored in Whole Cents (`BIGINT`), Never Decimals:** Computers make tiny rounding mistakes with decimal numbers (`0.1 + 0.2 = 0.30000000000000004`). In banking, `R 248,500.00` is stored as the whole integer `24850000` (cents). Only convert cents to `"R 248,500.00"` at the very end when displaying text on screen.
3. **The AI Can Suggest, But Only a Human Fingerprint Moves Money (Two-Phase HITL):** Our AI agents (*Jabu*, *Kagiso*, and *Thabo*) **do not have permission** to change account balances. When a user says *"Send R1,500 to Mom"*, the AI creates a **draft ticket** (`PENDING_APPROVAL`). Money only moves after the user scans their fingerprint/face on Android (`BiometricPrompt`), which sends a separate confirmation request (`POST /v1/approvals/{id}/confirm`).
4. **Stay Under `$20/Month` (`~$1–$9/Month` Target):**
   - Use **Supabase Free Tier** (`$0`), **Tavily Free Tier** (`$0` for 1,000 searches/mo), **Google Cloud Run** (`$0` scale-to-zero when nobody is using the app), and **Firebase App Distribution** (`$0` Android APK sharing).
   - Use **`gemini-3.8-flash`** (Google's current fast, low-cost Gemini model — older `gemini-2.5-*` models are deprecated) with a **`$10/month` hard billing alert/cap** in Google Cloud and a **50 messages/day** limit per user.

---

## 1. Prerequisites (One-Time Laptop Setup)

Install these free tools on your computer before starting:

1. **Node.js 22 LTS:** Needed for the Android Expo app (`mobile/`) and the CopilotKit gateway (`backend/copilot-runtime/`). Check with `node -v`.
2. **Python 3.10 – 3.12:** Needed for the FastAPI banking & AI backend (`backend/`). Check with `python3 --version`.
3. **Android Studio + Android Emulator (or a real Android phone with a USB cable):**
   - Open Android Studio $\rightarrow$ **Virtual Device Manager** $\rightarrow$ create a **Pixel 8 (API 34 or 35)** emulator.
   - *(Tip: Inside an Android Emulator, `localhost` means the phone itself. To talk to a server running on your laptop, Android uses the special address **`10.0.2.2`** — we have already pre-configured this for you!)*
4. **Free Cloud Accounts (Optional at first — Demo Mode works offline!):**
   - **Supabase** (`https://supabase.com`) — Free project for Postgres database + Auth.
   - **Google AI Studio** (`https://aistudio.google.com`) — Free `GEMINI_API_KEY` for `gemini-3.8-flash`.
   - **Tavily** (`https://tavily.com`) — Free Researcher `TAVILY_API_KEY` (1,000 searches/month at `$0`).

---

## 2. Phase 2 — Foundation, Ledger Database & App Scaffolds *(Scaffolded in Repo!)*

**Goal of Phase 2:** Set up the database tables, the backend safety engine, and the Android app skeleton so everything compiles, passes tests, and runs locally in **Demo Mode** (`R 248,500.00` portfolio) even before you connect live cloud keys.

> **Good news:** Phase 2 has already been scaffolded in your repository! Follow Steps 2.1–2.4 below to run and verify it on your machine.

### Step 2.1 — Understand What Was Created in Phase 2

- **Database Schema (`backend/supabase/`):**
  - [`202610290001_sahara_mzansi_schema.sql`](../backend/supabase/migrations/202610290001_sahara_mzansi_schema.sql): Creates `profiles`, `fica_verifications`, `accounts`, `virtual_cards` (stores `last4` only — never 16-digit card numbers!), `wealth_vaults`, `beneficiaries`, `automation_rules`, `approval_requests`, `ledger_transactions`, `ledger_entries` (every transfer writes a matching `DEBIT` and `CREDIT`), `literacy_knowledge` (`pgvector`), and `audit_events` (locked so rows can **never** be edited or deleted).
  - [`seed.sql`](../backend/supabase/seed.sql): Loads curated South African financial literacy topics (PayShap vs EFT fees, inflation vs 8.25% Notice Stash, SARS R36,000/yr TFSA cap, DebiCheck protection).
- **Backend (`backend/`):**
  - [`copilot-runtime/src/server.ts`](../backend/copilot-runtime/src/server.ts): Port `:8200` gateway that checks the user's login token and blocks anyone exceeding `50` AI turns per day.
  - [`app/process/fica.py`](../backend/app/process/fica.py): Validates real 13-digit South African ID numbers (Luhn check digit, birth date, SA citizen check, age 18+, POPIA consent) and hashes the ID so raw IDs are never saved in plain text.
  - [`app/process/ledger_service.py`](../backend/app/process/ledger_service.py): Enforces the Two-Phase Biometric HITL rule and `X-Idempotency-Key` (a unique receipt stamp on each button tap so tapping "Pay" twice on slow mobile data **never** charges the user twice).
- **Android App (`mobile/`):**
  - [`mobile/index.js`](../mobile/index.js): Loads `react-native-get-random-values` on **Line 1** before `@copilotkit/react-native/polyfills` on **Line 2** (if you swap these two lines, React Native falls back to insecure random numbers!).
  - [`mobile/src/components/genui/GenUIRegistry.tsx`](../mobile/src/components/genui/GenUIRegistry.tsx): Imports **only** from `@copilotkit/react-native/headless` (importing from the root `@copilotkit/react-native` package crashes Metro with a missing `expo-document-picker` error).

### Step 2.2 — Run and Test the Python Backend Locally

Open a terminal and run:

```bash
cd backend
cp .env.example .env

# Create an isolated Python virtual environment (never install packages globally)
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -e ".[dev]"

# Run code quality and banking safety tests
.venv/bin/ruff check .
.venv/bin/pytest -v

# Start the FastAPI server on port 8000
.venv/bin/uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/v1/portfolio` in your browser or run `curl http://localhost:8000/v1/portfolio` — you will see Elena Rostova's `24850000` cents (`R 248,500.00 ZAR`) demo wealth portfolio!

### Step 2.3 — Start the CopilotKit Gateway & Android App

Open a **second terminal** for the CopilotKit gateway (`:8200`):

```bash
cd backend/copilot-runtime
npm install
npm run typecheck
npm run dev
```

Open a **third terminal** for the Android mobile app (make sure your Android Emulator is open, or plug in your Android phone via USB and run `adb reverse tcp:8000 tcp:8000 && adb reverse tcp:8200 tcp:8200`):

```bash
cd mobile
cp .env.example .env
npm install
npm run typecheck
npx expo start --android
```

### Step 2.4 — (When Ready for Cloud DB) Apply the Supabase SQL Schema

1. Create a free project at `https://supabase.com`.
2. Open **SQL Editor** in your Supabase dashboard.
3. Paste and run [`backend/supabase/migrations/202610290001_sahara_mzansi_schema.sql`](../backend/supabase/migrations/202610290001_sahara_mzansi_schema.sql), then [`backend/supabase/seed.sql`](../backend/supabase/seed.sql).
4. Copy your **Project URL**, **`anon` public key**, and **`service_role` secret key** from **Project Settings $\rightarrow$ API** into `backend/.env` (and ONLY the URL + `anon` key into `mobile/.env` — **never** put `service_role` inside the mobile app!).

### Phase 2 "Done When" Checklist
- [x] `.venv/bin/pytest` passes all 5 banking safety tests (FICA checksum, zero balance change on AI stage, biometric 403 block, double-entry balance, idempotency replay).
- [x] `mobile/index.js` has `import "react-native-get-random-values";` on Line 1.
- [x] `npm run typecheck` passes in both `backend/copilot-runtime` and `mobile`.

---

## 3. Phase 3 — Build the Registration Flow & Wealth Dashboard (Screens 1 to 4)

**Goal of Phase 3:** Turn the Android welcome & dashboard scaffolds into the full 4-screen onboarding and post-login wealth landing experience shown in [`docs/designs/sahara-mzansi/screens/`](designs/sahara-mzansi/README.md).

### Step 3.1 — Screen 1: Welcome & Mobile Auth (`mobile/src/app/(auth)/welcome.tsx` & `login.tsx`)
Reference image: [`01_welcome_mobile_auth.png`](designs/sahara-mzansi/screens/01_welcome_mobile_auth.png)

1. **Create a Supabase Auth client** in `mobile/src/lib/supabase.ts` using `@supabase/supabase-js` and `expo-secure-store` as the `auth.storage` adapter so login tokens stay encrypted on the Android device (never use unencrypted `AsyncStorage` for banking tokens).
2. **Update `mobile/src/app/(auth)/welcome.tsx`:**
   - Display the two educational value pills (*8.25% APY Rand Stashes* and *R0.00 PayShap Instant Settlement*).
   - Add two clear buttons: **"Create Sahara Account"** (navigates to `/(onboarding)/fica`) and **"Sign In"** (navigates to `/(auth)/login`), plus a dev-only **"Quick Demo Persona"** button when `EXPO_PUBLIC_DEMO_MODE=true`.
3. **Create `mobile/src/app/(auth)/login.tsx`:**
   - Input field for South African mobile number (`+27`) or email address.
   - Send OTP via `supabase.auth.signInWithOtp({ email })` (free `$0` email OTP in dev so you pay zero SMS fees!).
   - On 6-digit OTP verification, save the session token via `saveAccessToken()` and route returning users to `/(tabs)/dashboard` (or new users without FICA status to `/(onboarding)/fica`).

### Step 3.2 — Screen 2: FICA Verification & Biometrics (`mobile/src/app/(onboarding)/fica.tsx`)
Reference image: [`02_fica_verification_biometrics.png`](designs/sahara-mzansi/screens/02_fica_verification_biometrics.png)

1. **Create `mobile/src/app/(onboarding)/fica.tsx`:**
   - Document selector segmented control: `Smart ID Card` | `Green ID Book` | `Passport`.
   - 13-digit numeric input (`keyboardType="number-pad"`, `maxLength={13}`).
   - Required **POPIA Consent checkbox**: *"I consent to identity verification under POPIA for simulated banking onboarding."* (Disable the Continue button until checked.)
2. **Connect to the backend FICA validator:**
   - Call `POST /v1/onboarding/fica/verify` with `{ document_type, sa_id_number, popia_consented, biometric_enrolled }`.
   - If the backend returns `422` (`application/problem+json`), show the friendly `detail` message right below the input (for example, *"Invalid 13-digit South African ID number"*).
3. **Enroll Android Biometrics:**
   - Trigger `LocalAuthentication.authenticateAsync({ promptMessage: "Enable Biometric Payment Protection" })` so the user tests their fingerprint/face sensor during onboarding.
   - Navigate to `/(onboarding)/setup` on success.

### Step 3.3 — Screen 3: Virtual Card, ShapID & Initial Deposit (`mobile/src/app/(onboarding)/setup.tsx`)
Reference image: [`03_virtual_card_payshap_setup.png`](designs/sahara-mzansi/screens/03_virtual_card_payshap_setup.png)

1. **Add endpoint `POST /v1/onboarding/provision` in `backend/app/api/v1.py`:**
   - Generates a tokenized virtual card (`card_token = "tok_sahara_..."`, `last4 = "9240"`), creates the user's `name@sahara.shap` handle, sets `safe_float_zar_cents` (default `R 3,200.00` = `320000`), and credits their chosen opening simulated balance (`R 1,000`, `R 25,000`, or the `R 248,500` Demo Wealth Portfolio) via a balanced `CREDIT`/`DEBIT` opening ledger entry.
2. **Create `mobile/src/app/(onboarding)/setup.tsx`:**
   - Render the warm terracotta Sahara Virtual Card preview showing `•••• •••• •••• 9240` (never generate or show a real 16-digit PAN or CVV!).
   - Let the user customize their `@sahara.shap` handle and Safe Daily Float Buffer (`R 2,000` / `R 3,200` / `R 5,000`).
   - Tap **"Launch My Wealth Dashboard"** $\rightarrow$ calls `POST /v1/onboarding/provision` and navigates to `/(tabs)/dashboard`.

### Step 3.4 — Screen 4: Complete the Super App Wealth Dashboard (`mobile/src/app/(tabs)/dashboard.tsx`)
Reference image: [`04_super_app_dashboard.png`](designs/sahara-mzansi/screens/04_super_app_dashboard.png)

1. **Enhance `mobile/src/app/(tabs)/dashboard.tsx`:**
   - **Multi-Account Drawer Pills** inside the Net Worth hero card (`Main Checking: R 168,200.00`, `Notice Stash 8.25%: R 80,300.00`).
   - **4-Button Fast Action Row:**
     - `PayShap (Free)` $\rightarrow$ opens `/(tabs)/copilot` pre-filled with a PayShap prompt.
     - `Sweep Yield` $\rightarrow$ opens Copilot to sweep idle cash into the 8.25% Notice Stash.
     - `Freeze Card` $\rightarrow$ calls `POST /v1/cards/card-sahara-9240/freeze?frozen=true` and updates the badge immediately.
     - `Learn` $\rightarrow$ opens Copilot with a financial literacy simulation prompt.
   - **Vault Progress Bars:** Add visual percentage bars (`current_cents / target_cents`) on each Smart Wealth Vault card (*Emergency Cushion*, *SARS TFSA*, *Cape Town Deposit*).
   - **Pull-to-Refresh:** Add `<RefreshControl>` so balances update immediately after any biometric payment settles.

### Phase 3 "Done When" Checklist
- [ ] A new user can go from **Screen 1 $\rightarrow$ Screen 2 (13-digit SA ID + POPIA + fingerprint) $\rightarrow$ Screen 3 (Card + ShapID) $\rightarrow$ Screen 4 (Dashboard)** without touching a web browser.
- [ ] Entering a fake 13-digit SA ID (e.g., `1234567890123`) is rejected cleanly on Screen 2.
- [ ] Freezing/unfreezing the virtual card on Screen 4 updates backend state and writes an `audit_events` record.

---

## 4. Phase 4 — CrewAI Flows, Tavily Literacy & Biometric HITL Payments (Screens 5 to 8)

**Goal of Phase 4:** Upgrade the AI Experience Layer so *Jabu*, *Kagiso*, and *Thabo* run as a stateful **CrewAI Flow** streaming live reasoning steps and interactive native Generative UI cards over **AG-UI**, grounded by **Tavily** + **Gemini (`gemini-3.8-flash`)**, with full hardware biometric payment clearance and bounded recurring payment rules.

### Step 4.1 — Enable Optional CrewAI + CopilotKit Python Extras
In `backend/`, install the agent orchestration extras inside your `.venv`:

```bash
cd backend
.venv/bin/pip install -e ".[agents,dev]"
```

And paste your free keys into `backend/.env`:
- `GEMINI_API_KEY=...` (from Google AI Studio — uses `gemini-3.8-flash`)
- `TAVILY_API_KEY=...` (from Tavily Free Tier — 1,000 searches/month at `$0`)

### Step 4.2 — Wire CrewAI Flow State Streaming (`backend/app/agents/sahara_flow.py`)
Following the CopilotKit + CrewAI Flows pattern ([ADR-003](decisions/ADR-003-orchestrate-agents-with-crewai-flows-gemini-and-tavily.md)):

1. **Subclass `CopilotKitState`:**
   - Define `SaharaFlowState(CopilotKitState)` with `logs: list[dict]`, `active_agent: str`, `staged_approval: dict | None`, and `literacy_simulation: dict | None`.
2. **Emit Live Reasoning Pills:**
   - Before each step (`resolve_recipient`, `check_safe_float`, `search_sa_financial_literacy`, `stage_transfer`), append a short status message to `self.state.logs` and call `await copilotkit_emit_state(self.state)` so the user sees live progress pills on Android (*"Jabu is checking your R3,200 Safe Daily Float..."*).
3. **Mount the Remote Endpoint in `backend/app/main.py`:**
   - Register `CopilotKitRemoteEndpoint(agents=[CrewAIAgent(name="sahara_mzansi_flow", flow=SaharaFlow())])` with `add_fastapi_endpoint(app, sdk, "/copilotkit")`, and point `backend/copilot-runtime` (`CopilotRuntime({ remoteEndpoints: [{ url: FASTAPI_AGENT_URL }] })`) to it.
4. **Add 24-Hour `pgvector` Caching for Tavily (`search_sa_financial_literacy`):**
   - Before calling `TavilyClient.search(...)`, check `public.literacy_knowledge` for a non-expired match (`cached_until > now()`). Save new Tavily snippets into `literacy_knowledge` for 24 hours so repeated questions about repo rates, inflation, or TFSA limits cost **zero** Tavily credits.

### Step 4.3 — Build the 4 Native Generative UI Cards (`mobile/src/components/genui/`)
Reference images: [`05_copilot_intent_recipient.png`](designs/sahara-mzansi/screens/05_copilot_intent_recipient.png) through [`08_payshap_settlement_receipt.png`](designs/sahara-mzansi/screens/08_payshap_settlement_receipt.png)

Keep every import strictly on **`@copilotkit/react-native/headless`** (`useRenderTool`, `useFrontendTool`, `ToolCallStatus`):

1. **Screen 5 — `RecipientResolutionCard.tsx` (`useRenderTool("resolveRecipient")`):**
   - Shows verified recipient name, bank badge, `ShapID`, and a side-by-side **Rail Literacy Pill**: `PayShap: R 0.00 (<10s)` vs `Instant EFT: R 50.00` (*"R 50.00 fee saved"*), plus a note explaining that `Main Checking` was chosen so the `8.25% Notice Stash` is not disturbed.
2. **Screen 6 — `InteractiveTransferCard.tsx` (`useRenderTool("stageTransfer")`):**
   - Allows the user to adjust the Rand amount (`+R100` / `-R100` chips or slider) before locking the proposal.
   - Displays two live guardrail bars:
     - **Safe Daily Float Check:** Green when `balance_after_cents >= safe_float_zar_cents`; amber warning if the transfer dips into the float buffer.
     - **Monthly Category Quota:** Shows `monthly_spent_cents / monthly_budget_cents` (e.g., *30% of R5,000 Monthly Family Support*).
   - Includes a **"Repeat Monthly on the 25th (Requires Biometric Approval)"** toggle for bounded payment automation (`automation_rules`).
3. **Screen 7 — `BiometricClearanceGate.tsx` (`useFrontendTool("authorizeStagedTransfer")`):**
   - Displays the locked `PENDING_APPROVAL` amount, recipient `ShapID`, `R 0.00` fee, and 15-minute expiry countdown.
   - When the user taps **"Authorize & Dispatch"**:
     1. Calls `requestBiometricClearance()` (`expo-local-authentication` $\rightarrow$ Android `BiometricPrompt`).
     2. Only if the fingerprint/face check succeeds, calls `confirmBiometricApproval({ approvalId, decision: "APPROVE", biometricAttestationId })` (which attaches `X-Idempotency-Key`).
     3. Calls `respond?.("Accepted")` so the CrewAI Flow resumes cleanly!
4. **Screen 8 — `PayShapReceiptCard.tsx` & `WealthLiteracySimulatorCard.tsx`:**
   - Renders the settled `SHAP-ZA-...` network reference, updated account balance, a native Android `Share.share({ message: whatsapp_receipt_text })` button for 1-tap WhatsApp proof-of-payment, and an interactive **Compound Yield vs. SA Inflation** card when the user asks wealth literacy questions.

### Step 4.4 — Bounded Payment Automation (`POST /v1/automation-rules`)
1. Add `POST /v1/automation-rules` and `DELETE /v1/automation-rules/{id}` in `backend/app/api/v1.py` so users can save or 1-tap revoke recurring rules (e.g., *"Pay Mom R1,500 on the 25th"* or *"Sweep surplus above R10,000 into Notice Stash on payday"*).
2. When a scheduled rule triggers (`pg_cron`), it **never** silently drains an account if the Safe Daily Float would be breached — instead, it stages a `PENDING_APPROVAL` notification ready for 1-tap biometric confirmation.

### Phase 4 "Done When" Checklist
- [ ] Asking *"Send R1,500 to my mom for groceries"* renders Screen 5 $\rightarrow$ Screen 6 $\rightarrow$ pauses at Screen 7 (`PENDING_APPROVAL`), with `R 0.00` deducted until you pass Android `BiometricPrompt`.
- [ ] Cancelling the Android fingerprint dialog leaves the account balance untouched (`R 168,200.00`).
- [ ] Approving with fingerprint settles the transfer in <1s, updates the Dashboard net worth, and lets you share the WhatsApp receipt on Screen 8.
- [ ] Asking *"Why does keeping R20,000 in checking lose money to inflation?"* renders the grounded literacy simulation with FAIS educational disclaimers.

---

## 5. Phase 5 — Guardrail Testing, Cloud Run Deploy & `$0` Android APK Sharing

**Goal of Phase 5:** Prove every banking guardrail with automated tests, deploy the backend to Google Cloud Run so it scales to `$0` when idle, lock the `$10/mo` Gemini budget cap, and generate an installable Android `.apk` for your demo!

### Step 5.1 — Run the Full Automated Safety & Hygiene Suite
Run all three checks locally (the exact same checks [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on every GitHub push):

```bash
# 1. Backend lint + guardrail tests
cd backend
.venv/bin/ruff check .
.venv/bin/pytest -v

# 2. CopilotKit Runtime gateway typecheck & security audit
cd copilot-runtime
npm run typecheck
npm audit --audit-level=high

# 3. Android mobile typecheck & security audit
cd ../../mobile
npm run typecheck
npm audit --audit-level=high
```

Add end-to-end negative tests in `backend/tests/` confirming:
1. Attempting to confirm an expired `approval_id` returns `410 Gone` (`application/problem+json`).
2. Attempting to transfer more than `balance_cents` returns `422 Unprocessable Entity`.
3. Sending `51` Copilot turns in one day returns `429 Daily Copilot Quota Reached`.

### Step 5.2 — Set Your `$10/Month` Hard FinOps Budget Alert (5 Minutes)
Before deploying to the internet, lock your wallet protection ([ADR-005](decisions/ADR-005-enforce-biometric-hitl-and-twenty-dollar-finops-cap.md)):
1. In **Google Cloud Console $\rightarrow$ Billing $\rightarrow$ Budgets & alerts**, create a budget set to **`$10.00 / month`** with email alerts at `50%` (`$5`), `80%` (`$8`), and `100%` (`$10`).
2. In **Google Cloud APIs & Services $\rightarrow$ Generative Language API $\rightarrow$ Quotas**, set a daily request cap so runaway scripts can never exceed your `$20/month` ceiling.

### Step 5.3 — Deploy Backend Containers to Google Cloud Run (`$0` Idle Cost)
Both backend services include production Dockerfiles ([`backend/Dockerfile.fastapi`](../backend/Dockerfile.fastapi) and [`backend/copilot-runtime/Dockerfile`](../backend/copilot-runtime/Dockerfile)). Deploy them with `--min-instances=0` and `--max-instances=2` so you pay **`$0.00`** whenever nobody is actively using the demo:

```bash
# 1. Deploy FastAPI Process + Agent service
gcloud run deploy sahara-fastapi \
  --source ./backend \
  --region africa-south1 \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=2 \
  --set-env-vars="DEMO_MODE=false,GEMINI_MODEL=gemini-3.8-flash"

# 2. Deploy CopilotKit Runtime v2 AG-UI Gateway
gcloud run deploy sahara-copilot-runtime \
  --source ./backend/copilot-runtime \
  --region africa-south1 \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=2 \
  --set-env-vars="DEMO_MODE=false,MAX_DAILY_TURNS_PER_USER=50,FASTAPI_AGENT_URL=https://<YOUR-FASTAPI-CLOUD-RUN-URL>/copilotkit"
```

*(Store `GEMINI_API_KEY`, `TAVILY_API_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in **Google Cloud Secret Manager** and attach via `--set-secrets` rather than plain command history.)*

### Step 5.4 — Build & Share the Native Android APK for `$0`
Point `mobile/.env` to your HTTPS Cloud Run URLs (`EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_COPILOT_RUNTIME_URL`), then build an installable Android `.apk` using **EAS Build (Free Tier)**:

```bash
cd mobile
npx eas-cli login
npx eas-cli build:configure

# Build an installable Android APK (instead of a Play Store .aab bundle) for direct demo testing
npx eas-cli build --platform android --profile preview
```

Share the resulting `.apk` link directly with demo testers or upload it to **Firebase App Distribution (`$0/month`)** for 1-tap over-the-air Android installation during your live demo!

### Phase 5 "Done When" Checklist
- [ ] GitHub Actions CI (`Sahara Mzansi Governance & CI`) is green on `main`.
- [ ] Cloud Run `min-instances` is `0` and Google Cloud `$10/mo` billing alert is active (total monthly spend `~$1–$9/mo`, strictly `<= $20/mo`).
- [ ] The Sahara Mzansi Android `.apk` installs cleanly on a physical Android phone, completes FICA onboarding, displays the Consolidated Wealth Dashboard, answers financial literacy questions, and settles a PayShap transfer only after hardware fingerprint/face verification.

---

## Quick Troubleshooting Cheat Sheet

| Symptom | Plain-English Cause | 1-Minute Fix |
| :--- | :--- | :--- |
| Android Emulator says `Network request failed` calling `localhost:8000` | Inside Android Emulator, `localhost` points to the virtual phone itself, not your laptop. | Use `http://10.0.2.2:8000` and `http://10.0.2.2:8200/api/copilotkit` in `mobile/.env`. On a real USB phone, run `adb reverse tcp:8000 tcp:8000 && adb reverse tcp:8200 tcp:8200`. |
| Metro bundler crashes with `Unable to resolve module expo-document-picker` | A file imported from `"@copilotkit/react-native"` instead of `/headless`. | Change the import to `"@copilotkit/react-native/headless"` ([ADR-002](decisions/ADR-002-adopt-copilotkit-react-native-headless-and-ag-ui.md)). |
| Crypto / UUID error in React Native Hermes | Polyfill order was changed in `mobile/index.js`. | Keep `import "react-native-get-random-values";` on **Line 1** of `mobile/index.js` before `@copilotkit/react-native/polyfills`. |
| `403 Biometric Clearance Required` on `/confirm` | Payment confirmation was called without `biometric_attestation_id`. | Ensure `useBiometricHitl().requestBiometricClearance()` runs and succeeds before calling `confirmBiometricApproval()`. |
