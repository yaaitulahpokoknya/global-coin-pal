# 🏗️ NusaWallet — System Architecture

> Mapping antara **proposal §8 (Konsep Teknis)** dengan **implementasi MVP**.

---

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  1. PRESENTATION LAYER                                          │
│  ─────────────────────                                          │
│  React 19 + TanStack Start + Tailwind v4                        │
│                                                                  │
│  • /              → Landing (hero, CTA)                          │
│  • /auth          → Login / signup                               │
│  • /dashboard     → Wallet UI (jantung demo)                     │
│  • /pay/$token    → Payment link (penerima)                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│  2. API LAYER                                                   │
│  ────────────                                                    │
│  Supabase Auto-REST + RLS + JWT                                 │
│                                                                  │
│  • Auth: email/password (signup, login, session)                │
│  • REST: auto-generated dari schema Postgres                    │
│  • Auth header → diteruskan ke RLS policy                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│  3. BUSINESS LOGIC LAYER                                        │
│  ───────────────────────                                         │
│  Inline di route handlers + helper modules                      │
│                                                                  │
│  • Wallet service     → updateBalance() di dashboard.tsx        │
│  • Transaction svc    → insert ke transactions table            │
│  • Conversion svc     → convert(), pairRate() dari fx.ts        │
│  • Payment Link svc   → /pay/$token route                       │
└──────────────┬─────────────────────────────────┬────────────────┘
               │                                 │
┌──────────────▼──────────────┐   ┌──────────────▼────────────────┐
│  4. INTELLIGENCE LAYER       │   │  4. INTELLIGENCE LAYER         │
│  (FX Recommendation)         │   │  (Fraud Detection)             │
│  ─────────────────────       │   │  ───────────────────           │
│  src/lib/fx.ts               │   │  src/lib/fraud.ts              │
│                              │   │                                │
│  • SMA 7-day                 │   │  • Rule 1: Large amount (≥$5k) │
│  • Std deviation σ           │   │  • Rule 2: High-risk geo       │
│  • Z-score → confidence      │   │  • Rule 3: Velocity (3 in 10m) │
│  • Best/worst scenario (±σ)  │   │  • Rule 4: Unknown + large     │
│  • Signal: BUY / HOLD / WAIT │   │  • Rule 5: Round-number flag   │
│                              │   │  • Score 0–100, ≥70 = BLOCK    │
└──────────────┬───────────────┘   └──────────────┬─────────────────┘
               │                                  │
┌──────────────▼──────────────────────────────────▼────────────────┐
│  5. DATA LAYER                                                   │
│  ─────────────                                                    │
│  PostgreSQL (Supabase)                                           │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   profiles   │  │   wallets    │  │ transactions │           │
│  │ id, name,    │  │ user_id,     │  │ user_id,     │           │
│  │ email,       │  │ currency,    │  │ type, status,│           │
│  │ country,     │  │ balance      │  │ from/to amt, │           │
│  │ kyc_status   │  │ (4 per user) │  │ fraud_reasons│           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
│  ┌──────────────┐                                                │
│  │   fx_rates   │  ← seeded 30 hari history                      │
│  │ base, quote, │     (USD → IDR, SGD, MYR)                      │
│  │ rate, time   │                                                │
│  └──────────────┘                                                │
│                                                                   │
│  Semua tabel: Row-Level Security (auth.uid() = user_id)          │
│  Trigger: handle_new_user() → auto-seed 4 wallet on signup       │
└──────────────────────────────┬───────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│  6. EXTERNAL DATA LAYER                                          │
│  ───────────────────────                                          │
│  • FX history seeded (mock historical dataset)                   │
│  • Roadmap: Wise / OANDA API via cron → fx_rates                 │
│  • Roadmap: Payment gateway integration (BI-FAST, PayNow, dll)   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Mapping ke Proposal §8

| Layer Proposal | Tech Disebut Proposal | Implementasi MVP | Justifikasi |
|----------------|----------------------|------------------|-------------|
| 1. Presentation | React Native / Flutter | React 19 web (TanStack Start) | Web SSR lebih cepat untuk demo + PWA-ready untuk mobile |
| 2. API | FastAPI / Django REST | Supabase auto-REST | Same REST contract, less boilerplate untuk hackathon scope |
| 3. Business Logic | User/Wallet/Tx/Conversion service | Modular helpers di `src/` | Logic tetap separated, mudah extract ke microservice |
| 4. Intelligence | FX Rec + Fraud Detection | `src/lib/fx.ts` + `src/lib/fraud.ts` | **Pure TypeScript — portable ke FastAPI/Django** |
| 5. Data | PostgreSQL | PostgreSQL (Supabase) | ✅ Same |
| 6. External Data | Exchange Rate API + Historical | Seeded historical (30 hari) | Production: integrate Wise/OANDA |

---

## Security Model

```
┌────────────────────────────────────────────────────────┐
│  Browser (React)                                       │
│  ─────────────                                         │
│  • Anon key (publishable, safe to expose)              │
│  • Auth token disimpan di localStorage (Supabase SDK)  │
│  • Setiap request → Bearer token di header             │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼─────────────────────────────┐
│  Supabase API Gateway                                  │
│  ───────────────────                                    │
│  • JWT validation                                      │
│  • auth.uid() di-extract dari token                    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│  Postgres + RLS                                        │
│  ──────────────                                         │
│  Setiap query otomatis di-rewrite dengan policy:       │
│                                                         │
│  SELECT * FROM wallets                                 │
│    WHERE auth.uid() = user_id;  ← injected oleh RLS    │
│                                                         │
│  Hasil: User A tidak akan pernah lihat data User B     │
│  meskipun pakai SDK yang sama.                         │
└────────────────────────────────────────────────────────┘
```

### RLS Policies aktif

| Tabel | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | own only | own only | own only | ❌ |
| `wallets` | own only | own only | own only | ❌ |
| `transactions` | own only | own only | own only | ❌ |
| `fx_rates` | public read | ❌ | ❌ | ❌ |

### Compliance considerations (proposal §9)

- **KYC**: field `kyc_status` di `profiles` (placeholder `verified` di MVP). Production: integrate Dukcapil / e-KTP verification API.
- **AML**: fraud engine sudah deteksi pattern (high-risk geo, velocity, large amount). Audit trail lengkap di `transactions.fraud_reasons[]`.
- **Data protection**: HTTPS only, password hashed (bcrypt via Supabase Auth), no PII di log.

---

## Skalabilitas

```
Saat ini (MVP)                  Production-ready
──────────────                  ─────────────────
Supabase shared instance   →    Dedicated Postgres + read replicas
Client-side fraud engine   →    Server-side function (TanStack Start)
Seeded FX data             →    Cron job → Wise/OANDA API
Single-region              →    Multi-region edge (Cloudflare Workers)
```

Karena seluruh AI logic ada di pure-TS module (`src/lib/`), porting ke backend
Python (FastAPI/Django) tinggal **transliterasi function** — tidak ada
dependency yang TS-specific.

---

## File ↔ Layer Mapping

| File | Layer | Tanggung jawab |
|------|-------|----------------|
| `src/routes/index.tsx` | Presentation | Landing + CTA |
| `src/routes/auth.tsx` | Presentation + API | Signup/login |
| `src/routes/dashboard.tsx` | Presentation + Logic | Wallet UI + actions |
| `src/routes/pay.$token.tsx` | Presentation | Payment link recipient view |
| `src/lib/fx.ts` | Intelligence | FX rec engine (portable) |
| `src/lib/fraud.ts` | Intelligence | Fraud scoring (portable) |
| `src/lib/format.ts` | Logic | Currency/date formatting |
| `supabase/migrations/*.sql` | Data | Schema + RLS + trigger |
| `supabase/fixtures/seed.sql` | Data (dev) | Demo users + history |

---

**Lihat juga:**
- [`README.md`](./README.md) — overview & cara run
- [`DEMO.md`](./DEMO.md) — script demo 2-3 menit
- [`AUDIT.md`](./AUDIT.md) — audit proposal vs implementation
