
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  country text default 'ID',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup, plus seed wallets in 4 currencies
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email);

  insert into public.wallets (user_id, currency, balance) values
    (new.id, 'IDR', 2500000),
    (new.id, 'USD', 120),
    (new.id, 'SGD', 0),
    (new.id, 'MYR', 0);
  return new;
end;
$$;

-- Wallets (multi-currency)
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  currency text not null check (currency in ('IDR','USD','SGD','MYR')),
  balance numeric(18,4) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, currency)
);
alter table public.wallets enable row level security;
create policy "own wallets read" on public.wallets for select using (auth.uid() = user_id);
create policy "own wallets update" on public.wallets for update using (auth.uid() = user_id);
create policy "own wallets insert" on public.wallets for insert with check (auth.uid() = user_id);

-- Transactions
create type public.tx_type as enum ('receive','send','convert','topup');
create type public.tx_status as enum ('completed','pending','flagged','blocked');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.tx_type not null,
  status public.tx_status not null default 'completed',
  from_currency text,
  to_currency text,
  from_amount numeric(18,4),
  to_amount numeric(18,4),
  fx_rate numeric(18,8),
  counterparty text,
  country text,
  note text,
  fraud_reasons text[],
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "own tx read" on public.transactions for select using (auth.uid() = user_id);
create policy "own tx insert" on public.transactions for insert with check (auth.uid() = user_id);
create policy "own tx update" on public.transactions for update using (auth.uid() = user_id);

create index on public.transactions (user_id, created_at desc);

-- FX rate history (for moving average recommendation). Public-readable.
create table public.fx_rates (
  id bigserial primary key,
  base text not null,
  quote text not null,
  rate numeric(18,8) not null,
  recorded_at timestamptz not null default now()
);
alter table public.fx_rates enable row level security;
create policy "fx public read" on public.fx_rates for select using (true);

create index on public.fx_rates (base, quote, recorded_at desc);

-- Trigger user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seed FX rate history (30 days, base=USD)
do $$
declare
  d int;
  base_rates jsonb := '{"IDR": 15800, "SGD": 1.34, "MYR": 4.70, "USD": 1}'::jsonb;
  q text;
  r numeric;
  noise numeric;
begin
  for d in 0..29 loop
    for q in select unnest(array['IDR','SGD','MYR']) loop
      r := (base_rates->>q)::numeric;
      -- Slight downward trend recently to make recommendation interesting
      noise := (random() - 0.5) * r * 0.01;
      if d < 7 then
        r := r - r * 0.008 + noise;
      else
        r := r + noise;
      end if;
      insert into public.fx_rates (base, quote, rate, recorded_at)
      values ('USD', q, round(r::numeric, 6), now() - (d || ' days')::interval);
    end loop;
  end loop;
end $$;
