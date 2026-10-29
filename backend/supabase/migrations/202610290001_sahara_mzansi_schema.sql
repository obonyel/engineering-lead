-- =============================================================================
-- Sahara Mzansi — Phase 2 Core Banking & Wealth Ledger Schema
-- Target: Supabase Postgres (Free Tier)
-- Rules:
--   1. All monetary values are stored in integer cents (BIGINT) — NEVER floats.
--   2. Every user table enforces Row-Level Security (auth.uid() = user_id).
--   3. Raw 16-digit PANs, CVVs, PINs, and plaintext SA IDs are NEVER stored.
--   4. ledger_transactions, ledger_entries, and audit_events are append-only.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- -----------------------------------------------------------------------------
-- 1. User Profiles & FICA Verification
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_e164 TEXT UNIQUE,
    shap_id TEXT UNIQUE,
    safe_float_zar_cents BIGINT NOT NULL DEFAULT 320000 CHECK (safe_float_zar_cents >= 0),
    fica_status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (fica_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    popia_consent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fica_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL
        CHECK (document_type IN ('SMART_ID', 'GREEN_BOOK', 'PASSPORT')),
    id_salted_hash TEXT NOT NULL,
    birth_date DATE NOT NULL,
    citizenship TEXT NOT NULL CHECK (citizenship IN ('SA_CITIZEN', 'PERMANENT_RESIDENT', 'FOREIGN_PASSPORT')),
    biometric_enrolled BOOLEAN NOT NULL DEFAULT FALSE,
    popia_consented BOOLEAN NOT NULL DEFAULT TRUE CHECK (popia_consented = TRUE),
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. Accounts, Tokenized Virtual Cards & Smart Wealth Vaults
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_type TEXT NOT NULL
        CHECK (account_type IN ('MAIN_TRANSACT', 'NOTICE_STASH', 'USD_VAULT')),
    name TEXT NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'ZAR',
    balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
    apy_bps INTEGER NOT NULL DEFAULT 0 CHECK (apy_bps >= 0),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.virtual_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    card_token TEXT NOT NULL UNIQUE,
    last4 CHAR(4) NOT NULL CHECK (last4 ~ '^[0-9]{4}$'),
    brand TEXT NOT NULL DEFAULT 'VISA',
    frozen BOOLEAN NOT NULL DEFAULT FALSE,
    daily_limit_cents BIGINT NOT NULL DEFAULT 1500000 CHECK (daily_limit_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wealth_vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'EMERGENCY'
        CHECK (category IN ('EMERGENCY', 'PROPERTY', 'TFSA', 'CUSTOM')),
    target_cents BIGINT NOT NULL CHECK (target_cents > 0),
    current_cents BIGINT NOT NULL DEFAULT 0 CHECK (current_cents >= 0),
    apy_bps INTEGER NOT NULL DEFAULT 825 CHECK (apy_bps >= 0),
    notice_days INTEGER NOT NULL DEFAULT 0 CHECK (notice_days >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. Beneficiaries & Bounded Payment Automation Rules
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    relationship TEXT NOT NULL DEFAULT 'CONTACT',
    shap_id TEXT,
    bank_name TEXT NOT NULL,
    account_masked TEXT NOT NULL,
    preferred_rail TEXT NOT NULL DEFAULT 'PAYSHAP'
        CHECK (preferred_rail IN ('PAYSHAP', 'EFT_RTC', 'INTERNAL_SWEEP')),
    budget_category TEXT NOT NULL DEFAULT 'GENERAL',
    monthly_budget_cents BIGINT NOT NULL DEFAULT 500000 CHECK (monthly_budget_cents >= 0),
    monthly_spent_cents BIGINT NOT NULL DEFAULT 0 CHECK (monthly_spent_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL
        CHECK (rule_type IN ('RECURRING_PAYSHAP', 'IDLE_FLOAT_SWEEP', 'UTILITY_TOPUP')),
    source_account_id UUID NOT NULL REFERENCES public.accounts(id),
    beneficiary_id UUID REFERENCES public.beneficiaries(id),
    max_amount_cents BIGINT NOT NULL CHECK (max_amount_cents > 0),
    cron_schedule TEXT NOT NULL,
    requires_hitl BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. Two-Phase HITL Approval Queue & Double-Entry Ledger
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL
        CHECK (action_type IN ('PAYSHAP_TRANSFER', 'VAULT_SWEEP', 'BLOCK_DEBIT_ORDER', 'AUTOMATION_MANDATE')),
    status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL'
        CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED')),
    source_account_id UUID NOT NULL REFERENCES public.accounts(id),
    destination_account_id UUID REFERENCES public.accounts(id),
    beneficiary_id UUID REFERENCES public.beneficiaries(id),
    amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
    fee_cents BIGINT NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
    rail TEXT NOT NULL DEFAULT 'PAYSHAP',
    reference TEXT NOT NULL,
    agent_name TEXT NOT NULL DEFAULT 'Jabu',
    safe_float_after_cents BIGINT NOT NULL DEFAULT 0,
    biometric_attestation_id TEXT,
    idempotency_key TEXT UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    approval_request_id UUID UNIQUE REFERENCES public.approval_requests(id),
    idempotency_key TEXT NOT NULL UNIQUE,
    tx_type TEXT NOT NULL,
    rail TEXT NOT NULL,
    description TEXT NOT NULL,
    total_cents BIGINT NOT NULL CHECK (total_cents > 0),
    status TEXT NOT NULL DEFAULT 'SETTLED' CHECK (status IN ('SETTLED', 'REVERSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.ledger_transactions(id),
    account_ref TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 5. SA Financial Literacy Vector Store & Immutable Audit Log
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.literacy_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    summary TEXT NOT NULL,
    source_domain TEXT NOT NULL,
    source_url TEXT NOT NULL,
    embedding vector(768),
    cached_until TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    actor TEXT NOT NULL,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    correlation_id TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. Immutability Guardrails (Append-Only Enforcement)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_immutable_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Table % is append-only; UPDATE and DELETE are prohibited.', TG_TABLE_NAME;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_events_immutable ON public.audit_events;
CREATE TRIGGER trg_audit_events_immutable
BEFORE UPDATE OR DELETE ON public.audit_events
FOR EACH ROW EXECUTE FUNCTION public.prevent_immutable_mutation();

DROP TRIGGER IF EXISTS trg_ledger_entries_immutable ON public.ledger_entries;
CREATE TRIGGER trg_ledger_entries_immutable
BEFORE UPDATE OR DELETE ON public.ledger_entries
FOR EACH ROW EXECUTE FUNCTION public.prevent_immutable_mutation();

REVOKE UPDATE, DELETE ON public.audit_events FROM PUBLIC, anon, authenticated;
REVOKE UPDATE, DELETE ON public.ledger_entries FROM PUBLIC, anon, authenticated;
REVOKE UPDATE, DELETE ON public.ledger_transactions FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. Row-Level Security Policies (Channel Reads Scoped to auth.uid(); Process Writes)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fica_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wealth_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.literacy_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY accounts_select_own ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY virtual_cards_select_own ON public.virtual_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY wealth_vaults_select_own ON public.wealth_vaults
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY beneficiaries_select_own ON public.beneficiaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY automation_rules_select_own ON public.automation_rules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY approval_requests_select_own ON public.approval_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY ledger_transactions_select_own ON public.ledger_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY literacy_knowledge_read_all ON public.literacy_knowledge
    FOR SELECT USING (true);
