# 🌏 NusaWallet — Hackathon Demo Flow

**Durasi target:** 2–3 menit
**Tagline:** *One wallet. Every currency in SEA. AI-powered & fraud-safe.*

---

## 🧱 Stack (versi MVP ini)

| Layer        | Tech                                                |
| ------------ | --------------------------------------------------- |
| Frontend     | React 19 + TanStack Start + Tailwind v4             |
| Backend / DB | Supabase (Postgres + Auth + RLS)                    |
| AI Modules   | Pure TS — `src/lib/fx.ts`, `src/lib/fraud.ts`       |
| Styling      | Modern fintech (electric blue + crimson, dark navy) |

> Logic AI-nya **portable** — file di `src/lib/` bisa langsung di-copy ke repo Next.js / Django kamu tanpa dependency tambahan.

---

## 🗄️ Skema Database

```
profiles      → 1 row per user (auto-created on signup)
wallets       → 4 rows per user (IDR, USD, SGD, MYR), seeded balance
transactions  → riwayat: receive | send | convert | topup
fx_rates      → 30 hari history per quote currency (IDR/SGD/MYR vs USD)
```

Trigger `handle_new_user()` otomatis seed wallet baru saat signup:
- IDR: 2.500.000
- USD: 120
- SGD: 0
- MYR: 0

Semua tabel dilindungi **RLS** — user hanya bisa baca/tulis data miliknya sendiri.

---

## 🎬 DEMO FLOW (urut, 2–3 menit)

### **0. Pembukaan (15 detik)** — Landing Page `/`

> *"NusaWallet adalah dompet multi-mata uang untuk Asia Tenggara. Satu akun untuk IDR, USD, SGD, dan MYR — dengan rekomendasi FX berbasis AI dan deteksi fraud real-time."*

- Tunjukkan hero, preview wallet card di kanan.
- Klik **"Open your wallet"** → `/auth`.

---

### **1. Login / Signup (20 detik)** — `/auth`

> *"Saya buat akun baru — sistem otomatis membuat profil dan 4 wallet kosong via database trigger."*

- Mode default: **Sign up**.
- Isi: nama, email, password (min 6 char).
- Klik **Create account** → otomatis redirect ke `/dashboard`.

✅ **Yang terjadi di backend:**
- `auth.users` row dibuat
- Trigger `handle_new_user()` jalan → seed `profiles` + 4 `wallets`
- Session disimpan di `localStorage` via Supabase client

---

### **2. Lihat Dashboard & Saldo (15 detik)** — `/dashboard`

> *"Ini total saldo dalam USD, dihitung dari semua wallet pakai rate terbaru. Empat kartu wallet dengan equivalent USD masing-masing."*

Tunjukkan:
- **Total balance** (heading bicolor gradient).
- 4 kartu wallet (IDR / USD / SGD / MYR).
- Panel **AI FX Recommendation** + **Fraud Protection** di bawah.

---

### **3. Receive Payment USD (20 detik)**

> *"Anggap saya baru terima invoice payment $850 dari klien di San Francisco."*

- Klik tombol **Receive** (biru, kiri atas action bar).
- Toast muncul: *"Received $ 850.00 from Acme Corp"*.
- Saldo USD bertambah, total balance update, transaksi baru muncul di **Recent activity**.

✅ **Yang terjadi:**
- `wallets.balance` USD += 850
- `transactions` insert: type=`receive`, status=`completed`, counterparty=`Acme Corp`

---

### **4. AI FX Recommendation (20 detik)**

> *"AI engine kami pakai 7-day moving average. Kalau rate hari ini jauh di bawah rata-rata, artinya waktu yang bagus untuk buy."*

Tunjukkan panel **AI FX Recommendation**:
- Signal **BUY / HOLD / WAIT** (badge berwarna).
- Headline contoh: *"Good time to buy USD"*.
- 3 mini-card: USD/IDR, SGD/IDR, MYR/IDR dengan % vs 7d avg.

📐 **Rumus** (`src/lib/fx.ts → recommend()`):
```
changePct = (today - sma7) / sma7 * 100
changePct < -0.4%  → BUY
changePct > +0.6%  → WAIT
otherwise          → HOLD
```

---

### **5. Convert Currency (25 detik)**

> *"Rate-nya bagus — saya convert $500 ke IDR sekarang."*

- Klik **Convert** (glass button).
- From = USD, To = IDR, Amount = `500`.
- Lihat preview rate live + jumlah yang diterima.
- Klik **Convert now** → toast sukses, kedua wallet update.

✅ **Yang terjadi:**
- USD -= 500, IDR += 500 × rate
- `transactions` insert: type=`convert`, fx_rate, from/to amount

---

### **6. 🚨 Trigger Fraud Alert (30 detik) — KILLER MOMENT**

> *"Sekarang demo paling penting — fraud detection real-time."*

- Klik **Trigger fraud demo** (di kartu Fraud Protection).
- Form Send otomatis terisi: **$6,000 USD → IDR**, country = **NG** (Nigeria), recipient = **Unknown recipient**.
- Klik **Send** → modal merah muncul:
  - Risk Score: **~90/100 (HIGH)**
  - Alasan: *Large transfer*, *High-risk destination*, *Unknown recipient*, *Round-number flag*.
  - Status: **🛑 BLOCKED** (tidak bisa diteruskan).

📐 **Engine** (`src/lib/fraud.ts → evaluateFraud()`):
```
+45  jika USD ≥ $5,000
+40  jika destination ∈ {NG, RU, KP, VE}
+30  jika ≥ 3 transaksi dalam 10 menit (velocity)
+15  jika "unknown" + amount ≥ $1,000
+5   jika round number (kelipatan 1000)
score ≥ 70 → BLOCK
```

> *"Sistem berhasil memblokir transaksi mencurigakan tanpa intervensi manual. Inilah yang bikin NusaWallet aman untuk cross-border SEA."*

---

### **7. Closing (10 detik)**

Tunjukkan **Recent activity** — semua transaksi tercatat (receive ✅, convert ✅, blocked ❌).

> *"Semua tersimpan dengan RLS — user lain tidak bisa lihat data ini. Logic FX dan fraud kami modular, siap di-port ke backend Django existing kami. Terima kasih!"*

---

## 🔑 Komponen Utama (untuk porting)

| File                              | Fungsi                                       |
| --------------------------------- | -------------------------------------------- |
| `src/lib/fx.ts`                   | Convert, pair rate, SMA, recommendation engine |
| `src/lib/fraud.ts`                | Fraud scoring engine (rule-based)            |
| `src/lib/format.ts`               | Currency formatting & relative time          |
| `src/routes/dashboard.tsx`        | Wallet UI + semua interaksi demo             |
| `src/routes/auth.tsx`             | Sign up / sign in                            |
| `supabase/migrations/`            | Skema DB + trigger + seed FX history         |

---

## 🧪 Pre-Demo Checklist

- [ ] Browser di-refresh, cache localStorage clean (atau pakai akun baru)
- [ ] Window di mode **incognito** untuk first-time signup yang clean
- [ ] Zoom browser **100%**, viewport ≥ 1280px untuk layout 2-kolom
- [ ] Suara notifikasi di-mute (toast pakai sonner)
- [ ] Siapkan **2 akun cadangan** kalau perlu re-demo signup flow
- [ ] Test dulu trigger fraud → pastikan modal block muncul

---

## 📈 Possible Q&A dari Juri

**Q: Kenapa rule-based, bukan ML?**
A: Untuk MVP, rule-based memberikan explainability yang dibutuhkan compliance. Roadmap: train classifier dari data transaksi historis untuk anomaly detection.

**Q: FX rate dari mana?**
A: Saat ini seeded historical data. Production akan integrate dengan Wise/OANDA API via cron job ke `fx_rates`.

**Q: Bagaimana scale-nya?**
A: Postgres + RLS handle multi-tenant secara native. Edge function bisa ditambahkan untuk webhook payment provider.

**Q: Multi-region compliance?**
A: Schema sudah ada `country` field di profiles & transactions, siap untuk routing per-jurisdiksi.

---

🎯 **Goal:** Buat juri ingat **"AI yang berhenti fraud sebelum uangnya hilang."**
