-- =============================================================================
-- Sahara Mzansi — Curated South African Financial Literacy Seed Data
-- Safe to run repeatedly (ON CONFLICT DO UPDATE).
-- Note: User-scoped demo persona data (Elena Rostova, R248,500.00 net worth)
-- is seeded automatically in Demo Mode or upon user onboarding in Supabase Auth.
-- =============================================================================

INSERT INTO public.literacy_knowledge (slug, title, category, summary, source_domain, source_url)
VALUES
(
    'payshap-vs-instant-eft',
    'PayShap vs Legacy Instant EFT Fees',
    'PAYMENT_RAILS',
    'PayShap settles instant interbank ZAR payments in under 10 seconds using a ShapID mobile proxy. On Sahara Mzansi, PayShap transfers carry R0.00 fee compared with R45.00–R50.00 on legacy RTC/Instant EFT rails — keeping up to R600/year compounding in your wealth vaults.',
    'banking.org.za',
    'https://www.banking.org.za/'
),
(
    'compound-yield-vs-sa-inflation',
    'Protecting Idle Cash Against South African Inflation',
    'WEALTH_BUILDING',
    'Leaving surplus cash in a 0% transactional account erodes purchasing power at ~4.5%–5.5% annual CPI inflation. Sweeping surplus above your Safe Daily Float Buffer into an 8.25% APY Notice Stash generates positive real yield while keeping emergency liquidity accessible.',
    'resbank.co.za',
    'https://www.resbank.co.za/'
),
(
    'sars-tfsa-annual-limits',
    'South African Tax-Free Savings Account (TFSA) Guardrails',
    'TAX_LITERACY',
    'Under SARS rules, South African residents can contribute up to R36,000 per tax year (R500,000 lifetime cap) into Tax-Free Savings Accounts with 0% tax on interest, dividends, or capital gains. Contributions above R36,000 incur a 40% penalty tax — never over-contribute.',
    'sars.gov.za',
    'https://www.sars.gov.za/'
),
(
    'debicheck-and-fee-defense',
    'DebiCheck Mandates & Unauthorized Debit Order Defense',
    'CONSUMER_PROTECTION',
    'Always verify recurring mandates before payday. Disputing unauthorized or duplicate debit orders promptly prevents R90–R150 unpaid-item penalty fees and protects your credit standing under National Credit Act (NCA) guidelines.',
    'fsca.co.za',
    'https://www.fsca.co.za/'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    updated_at = now();
