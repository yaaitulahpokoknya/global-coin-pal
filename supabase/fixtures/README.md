# 🗄️ Database Fixtures

Seed data untuk development & testing lokal NusaWallet.

## Isi

| File | Deskripsi |
|------|-----------|
| `seed.sql` | 2 demo users, wallet balance, 5 transaction sample, FX history fallback |

## Cara Pakai

### Setelah `supabase db reset` (lokal)

```bash
# Apply migrations dulu
supabase db reset

# Lalu load fixtures
psql "$(supabase status -o env | grep '^DB_URL' | cut -d= -f2-)" \
  -f supabase/fixtures/seed.sql
```

### Atau pakai Supabase CLI shortcut

```bash
supabase db reset --db-url "$DATABASE_URL"
psql "$DATABASE_URL" -f supabase/fixtures/seed.sql
```

## Demo Accounts

Setelah seed, login dengan:

| Email | Password | Role |
|-------|----------|------|
| `andi@nusawallet.demo` | `demo1234` | Power user — saldo besar, ada transaction history (termasuk 1 fraud-blocked) |
| `siti@nusawallet.demo` | `demo1234` | Fresh user — saldo default dari trigger (IDR 2.5M, USD 120) |

## Reset & Re-seed

```bash
# Hapus semua data user (cascade ke profiles, wallets, transactions)
psql "$DATABASE_URL" -c "delete from auth.users where email like '%@nusawallet.demo';"

# Re-run seed
psql "$DATABASE_URL" -f supabase/fixtures/seed.sql
```

## ⚠️ Catatan

- **JANGAN run di production!** Seed ini insert langsung ke `auth.users` — hanya untuk dev lokal.
- Password hash pakai `crypt()` dari extension `pgcrypto` (sudah aktif by default di Supabase).
- Trigger `handle_new_user()` akan otomatis bikin profile + 4 wallet kosong saat user di-insert. Seed lalu update wallet Andi jadi balance lebih tinggi.
