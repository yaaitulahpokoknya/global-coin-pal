# 🌏 NusaWallet

> **One wallet. Every currency in SEA. AI-powered & fraud-safe.**

NusaWallet adalah prototipe dompet **multi-mata uang** untuk Asia Tenggara (IDR, USD, SGD, MYR) dengan **rekomendasi FX berbasis AI** dan **deteksi fraud real-time**. Dibangun untuk hackathon BI — fokus pada *demo flow* yang clear dan logic AI yang portable.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🔐 **Auth + KYC badge** | Email/password signup + auto-seed wallet via DB trigger |
| 💰 **Multi-currency wallet** | 4 mata uang (IDR, USD, SGD, MYR), saldo real-time |
| 📥 **Receive** | Simulasi terima pembayaran cross-border |
| 🔄 **Convert** | Konversi antar mata uang dengan rate live |
| 📤 **Send** | Transfer dengan validasi fraud sebelum eksekusi |
| 🔗 **Payment Link** | Public link `/pay/$token` — pengirim luar negeri tanpa signup |
| 🧠 **AI FX Recommendation** | Sinyal BUY/HOLD/WAIT + **confidence bar** + **best/worst scenario** (SMA + σ) |
| 🚨 **Fraud Detection** | Rule-based scoring (0–100), explainable reasons, auto-block ≥70 |
| 🎭 **Demo Mode** | Klik "View demo" → langsung ke dashboard tanpa login |

---

## 🧱 Tech Stack

- **Frontend**: React 19 + TanStack Start v1 + Vite 7
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Backend**: Supabase (Postgres + Auth + RLS) via Lovable Cloud
- **AI Logic**: Pure TypeScript di `src/lib/fx.ts` & `src/lib/fraud.ts` (portable, no deps)
- **State**: TanStack Query + Supabase Realtime

---

## 📂 Struktur Project

```
nusa-wallet/
├── src/
│   ├── routes/                  # File-based routing (TanStack Router)
│   │   ├── __root.tsx           # Root layout
│   │   ├── index.tsx            # Landing page
│   │   ├── auth.tsx             # Login / signup
│   │   └── dashboard.tsx        # Wallet UI (jantung demo)
│   ├── lib/
│   │   ├── fx.ts                # FX engine: convert, SMA, recommendation
│   │   ├── fraud.ts             # Fraud scoring engine
│   │   └── format.ts            # Currency & date formatting
│   ├── components/
│   │   ├── Logo.tsx
│   │   └── ui/                  # shadcn components
│   ├── integrations/supabase/   # Auto-generated client (jangan edit)
│   └── styles.css               # Design tokens (oklch)
├── supabase/
│   ├── migrations/              # Skema DB + trigger + seed FX
│   ├── config.toml
│   └── fixtures/                # ⭐ Seed data untuk dev lokal
│       ├── seed.sql
│       └── README.md
├── DEMO.md                      # Flow demo step-by-step (2-3 menit)
└── README.md                    # File ini
```

---

## 🚀 Cara Run di Local

### Prasyarat

- **Bun** ≥ 1.0 ([install](https://bun.sh)) — atau Node ≥ 18 + npm
- **Git**
- (Optional) **Supabase CLI** kalau mau jalanin DB lokal sendiri

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd nusa-wallet
bun install
```

### 2. Setup environment variables

File `.env` sudah otomatis ter-generate kalau pakai Lovable Cloud. Kalau setup manual, buat file `.env` di root:

```bash
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon-key>"
VITE_SUPABASE_PROJECT_ID="<project-ref>"
```

> 💡 Untuk **demo mode** (tanpa Supabase), env tetap diperlukan untuk build, tapi tidak akan di-call. Klik tombol **"View demo"** di landing page → langsung jalan dengan data lokal.

### 3. Jalanin dev server

```bash
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### 4. Build production

```bash
bun run build
bun run start
```

---

## 🗄️ Setup Database Lokal (Optional)

Kalau mau test full flow dengan auth & persistence:

### Opsi A — Pakai Supabase Cloud (recommended untuk demo)

Project sudah otomatis terkoneksi via Lovable Cloud. Tinggal signup di `/auth` → trigger `handle_new_user()` otomatis seed wallet.

### Opsi B — Supabase lokal dengan Docker

```bash
# 1. Install Supabase CLI
npm i -g supabase

# 2. Start local stack (Postgres + Auth + Studio)
supabase start

# 3. Apply migrations
supabase db reset

# 4. Load fixture data (FX history + sample user)
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" \
  -f supabase/fixtures/seed.sql
```

Studio akan tersedia di `http://localhost:54323`. Update `.env` dengan URL & anon key dari `supabase status`.

---

## 🎬 Cara Demo

Buka [`DEMO.md`](./DEMO.md) untuk script lengkap (2–3 menit). Singkatnya:

1. **Landing** → klik **"View demo"** (instant, no login) atau **"Open your wallet"** (signup)
2. **Dashboard** → lihat 4 wallet + total balance USD
3. **Receive** → simulasi terima $850 dari Acme Corp
4. **AI FX panel** → tunjukkan signal BUY/HOLD/WAIT
5. **Convert** → $500 USD → IDR
6. **🚨 Trigger fraud demo** → modal merah, transaksi di-BLOCK
7. **Recent activity** → semua tercatat

---

## 🧠 AI Logic (Portable Modules)

Dua file pure-TS yang bisa di-copy ke project lain (Next.js, Express, dll):

### `src/lib/fx.ts` — FX recommendation

```ts
import { recommend } from "@/lib/fx";

const result = recommend(history, todayRate);
// → { signal: "BUY" | "HOLD" | "WAIT", changePct: -1.2, sma7: 15750 }
```

**Rumus**: `changePct = (today - sma7) / sma7 * 100`
- `< -0.4%` → **BUY**
- `> +0.6%` → **WAIT**
- otherwise → **HOLD**

### `src/lib/fraud.ts` — Fraud scoring

```ts
import { evaluateFraud } from "@/lib/fraud";

const result = evaluateFraud({ amount: 6000, currency: "USD", country: "NG", ... });
// → { riskScore: 90, level: "high", reasons: [...], shouldBlock: true }
```

**Rules** (lihat file untuk detail):
- `+45` jika ≥ $5,000 USD
- `+40` jika destination ∈ {NG, RU, KP, VE}
- `+30` jika ≥ 3 tx dalam 10 menit (velocity)
- `+15` jika unknown recipient + ≥ $1,000
- `+5` jika round number

Score ≥ 70 → auto-block.

---

## 🔒 Security

- **Row-Level Security** aktif di semua tabel (`profiles`, `wallets`, `transactions`)
- User hanya bisa baca/tulis data miliknya sendiri (`auth.uid() = user_id`)
- `fx_rates` public-read (data publik, tidak sensitif)
- Trigger `handle_new_user()` pakai `SECURITY DEFINER` dengan `search_path` di-set explicit

---

## 📜 Lisensi

MIT — bebas dipakai dan dimodifikasi untuk keperluan hackathon / pembelajaran.

---

**Dibuat untuk BI Hackathon 2026** 🇮🇩
