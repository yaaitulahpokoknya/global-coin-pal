-- ============================================================================
-- NusaWallet — Local Development Fixtures
-- ============================================================================
-- File ini berisi seed data realistic untuk testing & demo lokal.
-- 
-- Cara pakai:
--   psql $DATABASE_URL -f supabase/fixtures/seed.sql
--
-- Isi:
--   1. 2 demo users (Andi & Siti) di auth.users
--   2. Profiles + wallets ter-seed via trigger handle_new_user()
--   3. Tambahan saldo realistic per user
--   4. Transaction history (receive, convert, send, fraud-blocked)
--   5. FX rate history 30 hari (kalau belum ada dari migration)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DEMO USERS
-- ----------------------------------------------------------------------------
-- Password untuk kedua user: "demo1234"
-- Hash di bawah adalah bcrypt dari "demo1234" (cost 10)

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
(
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated',
  'andi@nusawallet.demo',
  crypt('demo1234', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Andi Pratama"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated', 'authenticated',
  'siti@nusawallet.demo',
  crypt('demo1234', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Siti Wulandari"}'::jsonb,
  now(), now(), '', '', '', ''
)
on conflict (id) do nothing;

-- Identities (required for Supabase auth login flow)
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) values
(
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"andi@nusawallet.demo"}'::jsonb,
  'email', 'andi@nusawallet.demo',
  now(), now(), now()
),
(
  gen_random_uuid(),
  '22222222-2222-2222-2222-222222222222',
  '{"sub":"22222222-2222-2222-2222-222222222222","email":"siti@nusawallet.demo"}'::jsonb,
  'email', 'siti@nusawallet.demo',
  now(), now(), now()
)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 2. EXTRA WALLET BALANCES
-- ----------------------------------------------------------------------------
-- Trigger handle_new_user() sudah seed default (IDR 2.5M, USD 120, SGD/MYR 0).
-- Kita upgrade Andi jadi power-user, Siti tetap fresh.

update public.wallets set balance = 18750000
  where user_id = '11111111-1111-1111-1111-111111111111' and currency = 'IDR';
update public.wallets set balance = 2340.50
  where user_id = '11111111-1111-1111-1111-111111111111' and currency = 'USD';
update public.wallets set balance = 1280.00
  where user_id = '11111111-1111-1111-1111-111111111111' and currency = 'SGD';
update public.wallets set balance = 4500.00
  where user_id = '11111111-1111-1111-1111-111111111111' and currency = 'MYR';

-- ----------------------------------------------------------------------------
-- 3. TRANSACTION HISTORY (untuk Andi)
-- ----------------------------------------------------------------------------
insert into public.transactions (
  user_id, type, status, from_currency, to_currency,
  from_amount, to_amount, fx_rate, counterparty, country, note, fraud_reasons, created_at
) values
-- Receive: invoice payment dari klien US
( '11111111-1111-1111-1111-111111111111', 'receive', 'completed',
  null, 'USD', null, 850.00, null,
  'Acme Corp', 'US', 'Invoice #INV-2025-091', null,
  now() - interval '2 days' ),

-- Convert: USD → IDR
( '11111111-1111-1111-1111-111111111111', 'convert', 'completed',
  'USD', 'IDR', 500.00, 7900000.00, 15800.00,
  null, null, 'Rebalance to local currency', null,
  now() - interval '1 day 4 hours' ),

-- Send: legit transfer ke Singapore
( '11111111-1111-1111-1111-111111111111', 'send', 'completed',
  'SGD', null, 220.00, null, null,
  'Tan Wei Ming', 'SG', 'Freelance payout', null,
  now() - interval '18 hours' ),

-- Receive: top-up dari bank lokal
( '11111111-1111-1111-1111-111111111111', 'topup', 'completed',
  null, 'IDR', null, 5000000.00, null,
  'BCA Transfer', 'ID', 'Monthly top-up', null,
  now() - interval '12 hours' ),

-- Send: BLOCKED (fraud demo)
( '11111111-1111-1111-1111-111111111111', 'send', 'blocked',
  'USD', null, 6000.00, null, null,
  'Unknown recipient', 'NG', 'Blocked by fraud engine',
  array['Large transfer: ~$6000 USD equivalent',
        'Destination country (NG) flagged as high risk',
        'Large transfer to unknown recipient',
        'Suspicious round-number amount'],
  now() - interval '3 hours' );

-- ----------------------------------------------------------------------------
-- 4. FX RATES (kalau belum ada dari migration)
-- ----------------------------------------------------------------------------
-- Migration sudah seed 30 hari. Skip kalau sudah ada data.
do $$
begin
  if (select count(*) from public.fx_rates) = 0 then
    insert into public.fx_rates (base, quote, rate, recorded_at)
    select
      'USD',
      q.quote,
      case q.quote
        when 'IDR' then 15800 + (random() - 0.5) * 200
        when 'SGD' then 1.34  + (random() - 0.5) * 0.02
        when 'MYR' then 4.70  + (random() - 0.5) * 0.05
      end,
      now() - (d || ' days')::interval
    from generate_series(0, 29) as d
    cross join (values ('IDR'),('SGD'),('MYR')) as q(quote);
  end if;
end $$;

-- ============================================================================
-- DONE — Login dengan:
--   andi@nusawallet.demo  / demo1234   (power user, ada history)
--   siti@nusawallet.demo  / demo1234   (fresh user, default seed)
-- ============================================================================
