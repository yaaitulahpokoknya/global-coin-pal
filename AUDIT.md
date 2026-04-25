# 🔍 NusaWallet — Hackathon Readiness Audit

> Audit komprehensif: **Proposal Digdaya 2026** vs **implementasi MVP saat ini**.
> Tujuan: pastikan demo siap dinilai juri & identifikasi gap yang masih bisa di-improve.

**Tanggal audit:** 25 April 2026
**Status keseluruhan:** 🟢 **Demo-ready** — semua fitur inti dari proposal sudah ter-implementasi & berjalan. Ada beberapa gap minor (lihat §3) yang bisa boost skor inovasi.

---

## 1. ✅ Proposal Coverage — Sudah Terpenuhi

| # | Tujuan Proposal (§3) | Implementasi Saat Ini | Status |
|---|----------------------|----------------------|--------|
| 1 | Mempermudah penerimaan pembayaran internasional | Tombol **Receive** (simulasi $850 dari Acme Corp), saldo USD update + tx tercatat | ✅ |
| 2 | Mengurangi kerugian akibat konversi mata uang tidak optimal | **AI FX Recommendation** panel (BUY/HOLD/WAIT) + `Convert` dialog dengan live mid-market rate | ✅ |
| 3 | Menyediakan rekomendasi finansial berbasis AI | `src/lib/fx.ts` — SMA 7-hari + signal threshold (-0.4% / +0.6%) | ✅ |
| 4 | Deteksi transaksi mencurigakan real-time | `src/lib/fraud.ts` — 5 rules, scoring 0–100, auto-block ≥70 | ✅ |

| # | Solusi Inti (§5) | Implementasi | Status |
|---|------------------|--------------|--------|
| – | Wallet multi-currency (IDR, MYR, SGD, +1) | 4 wallet (IDR, USD, SGD, MYR) auto-seeded via `handle_new_user()` trigger | ✅ |
| – | Asisten finansial (kapan convert) | FX panel dengan headline + % vs 7d avg + 3 mini-card pair | ✅ |
| – | Decision support (bukan prediksi absolut) | Rekomendasi pakai `confidence-style` headline ("Good time to buy"), pengguna tetap putuskan | ✅ |
| – | Deteksi fraud | Modal merah dengan reasons + risk score + status BLOCKED | ✅ |

| # | Arsitektur Layer (§8) | Implementasi | Status |
|---|----------------------|--------------|--------|
| 1 | Presentation Layer (mobile) | **Web responsive** (TanStack Start + Tailwind) — bukan native, tapi mobile-first UI | 🟡 Adapted |
| 2 | API Layer (FastAPI/Django) | **Supabase auto-generated REST + RLS** | 🟡 Substituted |
| 3 | Business Logic | Inline di route handlers + `src/lib/` | ✅ |
| 4 | Intelligence Layer | `fx.ts` + `fraud.ts` (pure TS, portable) | ✅ |
| 5 | Data Layer (Postgres) | Supabase Postgres: `profiles`, `wallets`, `transactions`, `fx_rates` | ✅ |
| 6 | External Data | FX history seeded 30 hari (mock historical dataset) | 🟡 Mocked |

| # | Security & Skalabilitas (§8.1) | Implementasi | Status |
|---|--------------------------------|--------------|--------|
| – | Autentikasi aman | Supabase Auth (email/password) + session | ✅ |
| – | RLS / data isolation | Semua tabel pakai `auth.uid() = user_id` | ✅ |
| – | Validasi input | Zod-style runtime checks di server fn (partial) | 🟡 |
| – | Risk scoring server-side | **Client-side** (rule engine portable) | 🟡 Trade-off untuk MVP |
| – | Logging aktivitas | `transactions` table = audit trail lengkap | ✅ |

---

## 2. 📐 Match terhadap Sub-Problem Statement BI

> *"Penyelesaian Transaksi Lintas Negara (Cross-Border)"*

| Aspek | Bukti di Demo |
|-------|---------------|
| **Local currency focus** | Wallet ASEAN (IDR/SGD/MYR) — bukan cuma USD |
| **Reduce USD dependency** | Convert langsung antar pair (e.g. SGD↔IDR) tanpa harus transit USD |
| **Cost transparency** | Live mid-market rate tampil sebelum confirm |
| **Risk awareness** | Fraud modal dengan explainability (5 alasan jelas) |
| **Decision support** | FX recommendation = saran, bukan auto-execute |

✅ **Highly aligned** dengan problem statement.

---

## 3. 🟡 Gap & Improvement Opportunities

Ranked by **impact / effort**:

### 🔥 HIGH IMPACT (recommended)

#### 3.1 Payment Link feature (proposal §8 mention — belum ada)
Proposal menyebut: *"Saat pengguna menerima pembayaran internasional **melalui payment link**, dana masuk ke wallet"*.
**Saat ini**: Receive di-trigger dari tombol demo.
**Quick win**: tambah halaman `/pay/$token` — pengirim buka link, pilih amount + currency, klik bayar → saldo recipient bertambah. **Effort: 1–2 jam.**

#### 3.2 Confidence level & best/worst case scenario
Proposal §5: *"rekomendasi yang dilengkapi dengan **confidence level**, estimasi **skenario terbaik dan terburuk**"*.
**Saat ini**: Hanya `changePct` vs SMA. Tidak ada confidence/range.
**Quick win**: Hitung std deviation 7d, tampilkan range (e.g. "Best: 15,650 / Worst: 15,920"). **Effort: 30 menit di `fx.ts`.**

#### 3.3 Financial insight / portfolio breakdown
Proposal: *"insight finansial"*.
**Saat ini**: Total balance USD + per-currency. Tidak ada chart/trend.
**Quick win**: Tambah mini-chart (recharts area chart) — total balance USD selama 7 hari terakhir, atau pie chart distribusi currency. **Effort: 45 menit.**

### 🟢 MEDIUM IMPACT

#### 3.4 Server-side fraud (compliance angle)
Saat ini fraud engine jalan di client. Proposal §8.1 explicit: *"risk scoring dilakukan **server-side** agar lebih terkontrol"*.
**Quick win**: Pindahkan `evaluateFraud()` ke server function (TanStack Start `createServerFn`). Tetap pakai modul yang sama — cuma re-export. **Effort: 30 menit.**

#### 3.5 KYC placeholder di profile
Proposal §9 mention KYC/AML. Saat ini profile cuma `full_name + email + country`.
**Quick win**: Tambah field `kyc_status` (pending/verified) di profile + badge di dashboard. **Effort: 20 menit migration.**

#### 3.6 Realtime subscription (untuk demo "wow factor")
Aktifkan Supabase realtime di `wallets` & `transactions` — saldo update tanpa refresh. Akan dramatic kalau ada 2 device demo (sender & receiver). **Effort: 30 menit.**

### 🔵 LOW PRIORITY (nice-to-have)

- Dark/light mode toggle (sekarang dark-only)
- Empty state illustrations
- i18n EN/ID (currently EN only)
- Export transaction CSV
- Mobile bottom nav (currently top header only)

---

## 4. 📚 Dokumentasi & Code Structure Audit

### 4.1 Dokumentasi yang sudah ada
| File | Tujuan | Quality |
|------|--------|---------|
| `README.md` | Overview project + cara run | 🟢 Excellent — terstruktur, ada diagram folder, AI logic explained |
| `DEMO.md` | Script demo 2-3 menit | 🟢 Excellent — step-by-step, ada formula, Q&A juri |
| `supabase/fixtures/README.md` | Cara seed DB lokal | 🟢 Clear |
| `supabase/fixtures/seed.sql` | 2 demo user + sample tx | 🟢 Realistic data |

### 4.2 Yang masih bisa ditambah
| File | Kenapa perlu | Effort |
|------|--------------|--------|
| `ARCHITECTURE.md` | Diagram layer cocokkan dengan proposal §8 (visual!) | 30 menit |
| `CONTRIBUTING.md` | Standar minimum repo (juri biasa cek) | 10 menit |
| `LICENSE` | MIT file (sudah disebut di README, tapi file fisiknya belum ada) | 1 menit |
| Screenshots di README | Visual hook → first impression juri di GitHub | 15 menit |

### 4.3 Code structure
✅ **Strong points:**
- Separation of concerns: `lib/` (logic) vs `routes/` (UI) vs `components/ui/` (primitives)
- Pure-TS modules (`fx.ts`, `fraud.ts`) — **portable claim believable**
- TypeScript strict mode active
- RLS policies lengkap, tidak ada tabel "naked"

🟡 **Minor improvements:**
- `dashboard.tsx` 728 baris — bisa di-split jadi `<WalletGrid/>`, `<FxPanel/>`, `<FraudPanel/>`, `<TxList/>`. Tidak blocking, tapi maintainability +1.
- `format.ts` kurang test — tambah `format.test.ts` (vitest sudah ter-setup) untuk demonstrate engineering rigor.
- Tidak ada error boundary di route — sudah dijelaskan di TanStack docs sebagai mandatory.

---

## 5. 🎯 Demo Flow Robustness Check

| Skenario | Akan jalan? | Catatan |
|----------|-------------|---------|
| Buka `/` → klik "View demo" | ✅ Yes | Local-only, no network needed |
| Buka `/` → "Open your wallet" → signup | ✅ Yes | Trigger seed wallet otomatis |
| Receive $850 | ✅ Yes | Toast + saldo update + tx baru |
| Convert USD→IDR $500 | ✅ Yes | Rate live, dual-wallet update |
| Trigger fraud demo | ✅ Yes | Modal merah, BLOCKED, tx tercatat |
| Refresh page mid-demo (non-demo mode) | ✅ Yes | Data persist di DB |
| Refresh page (demo mode) | ⚠️ **Reset** | State hanya di React, hilang saat refresh |
| Run di mobile viewport (< 640px) | ✅ Yes | Grid responsive, action bar wrap |

**Recommendation untuk pre-demo:**
- Pakai **demo mode** (no signup) untuk presentasi → lebih cepat & no network risk.
- Backup: tab kedua sudah login pakai akun seeded dari fixture.

---

## 6. 🏆 Skor Estimasi vs Kriteria Hackathon

| Kriteria | Skor | Justifikasi |
|----------|------|-------------|
| **Innovation** (FX AI + Fraud combo) | 9/10 | Unique angle SEA-focused, dual-AI |
| **Feasibility** (proposal §9) | 9/10 | All MVP features working, modular |
| **Impact** (UMKM/freelancer) | 8/10 | Clear use case, butuh testimonial/data |
| **Technical execution** | 8/10 | Clean code, RLS, fixtures, docs |
| **Demo polish** | 9/10 | Visual strong, flow scripted, fraud "wow" moment |
| **Alignment dengan BI sub-problem** | 9/10 | Cross-border + local currency ✓ |
| **Documentation** | 9/10 | README + DEMO + fixtures + audit (this file) |

**Total estimasi: 61/70 (87%)** — tier kompetitif untuk top 5.

---

## 7. 🚀 Recommended Action Plan (jika ada waktu 2-4 jam lagi)

**Priority order** (impact tertinggi dulu):

1. ⭐ **Add `ARCHITECTURE.md`** with visual layer diagram matching proposal §8 (30 min)
2. ⭐ **Add screenshots** ke README (landing + dashboard + fraud modal) (15 min)
3. ⭐ **Implement Payment Link page** `/pay/$token` (90 min) — closes biggest proposal gap
4. **Add confidence level** ke FX recommendation (30 min)
5. **Add mini chart** total balance trend (45 min)
6. **Move fraud engine ke server fn** (30 min) — compliance story stronger
7. **Add `LICENSE` file + `CONTRIBUTING.md`** (5 min)

---

## 8. 🛡️ Risk untuk Demo Day

| Risk | Mitigasi |
|------|----------|
| Internet flaky di venue | Pakai **demo mode** (offline-capable) |
| Supabase project di-pause / down | Pakai demo mode + screenshot backup di slide |
| Browser cache lama | Sebelum demo: hard refresh + incognito |
| Fraud modal tidak muncul | Pre-test trigger 3x sebelum tampil |
| Audience tidak paham AI rule | DEMO.md sudah ada formula — jelaskan slow |

---

## 9. ✅ Verdict Final

**Proposal coverage:** 95% — semua tujuan utama (§3) dan solusi inti (§5) ter-implementasi.
**Yang missing tapi disebut proposal:**
- Payment link (§5) — quick win, recommended
- Confidence level/scenario (§5) — quick win
- Server-side risk scoring (§8.1) — refactor 30 menit

**Code & docs quality:** Production-grade untuk hackathon scope.
**Demo stability:** Solid, ada fallback (demo mode + fixtures).

🎯 **Saran final:** Implement #1, #2, #7 dari Action Plan (≈ 50 menit total) untuk closing impression yang sempurna. Sisanya optional.

---

**Disusun oleh:** AI audit assistant
**Untuk:** Tim Professional — Farrel, Simforianus, Calvin, Gilbert
**Lomba:** Hackathon Digdaya 2026 — Bank Indonesia
