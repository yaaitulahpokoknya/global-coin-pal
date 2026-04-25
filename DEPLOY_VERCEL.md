# Deploy ke Vercel (Gratis)

Vercel **Hobby plan = gratis** untuk personal/non-komersial. Support TanStack Start full SSR + server functions.

Ada **2 cara** deploy. Pilih salah satu.

---

## ✅ Cara 1: Auto-deploy via Vercel Dashboard (PALING MUDAH)

Tidak perlu workflow file, Vercel handle semuanya.

1. Push project ke GitHub (via Lovable Connectors → GitHub).
2. Buka [vercel.com/new](https://vercel.com/new) → login pakai GitHub.
3. **Import** repository kamu.
4. Framework Preset: **Other** (Vercel auto-detect Vite).
5. Build Command: `bun run build` · Output Directory: `dist` · Install: `bun install`.
6. **Environment Variables** (Settings → Environment Variables), tambahkan:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://bansjlfomenghvmwyjij.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | (anon key dari `.env`) |
   | `VITE_SUPABASE_PROJECT_ID` | `bansjlfomenghvmwyjij` |

7. Klik **Deploy**. Selesai. Tiap push ke `main` = auto deploy production. Tiap PR = preview URL.

**URL hasil**: `https://<project-name>.vercel.app`

---

## Cara 2: GitHub Actions (kalau mau kontrol penuh)

Pakai workflow `.github/workflows/vercel-deploy.yml` yang sudah dibuat.

### Setup token & IDs

1. Generate token: [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create Token.
2. Run sekali di local untuk dapat IDs:
   ```bash
   bunx vercel link
   cat .vercel/project.json
   ```
   Catat `orgId` dan `projectId`.

3. Repo GitHub → **Settings → Secrets and variables → Actions**:

   | Secret | Value |
   |--------|-------|
   | `VERCEL_TOKEN` | token dari step 1 |
   | `VERCEL_ORG_ID` | dari `project.json` |
   | `VERCEL_PROJECT_ID` | dari `project.json` |

4. Env vars Supabase tetap ditambah di **Vercel Dashboard → Project → Settings → Environment Variables** (sama seperti Cara 1 step 6).

5. Push ke `main` → workflow jalan otomatis.

---

## Konfigurasi Supabase

Setelah dapat URL Vercel, tambahkan ke **Supabase → Authentication → URL Configuration → Redirect URLs**:
- `https://<project-name>.vercel.app`
- `https://<project-name>.vercel.app/**`

Supaya OAuth/magic link redirect-nya valid.

---

## Custom Domain
Vercel Dashboard → Project → **Settings → Domains** → Add. Free SSL otomatis.

## Rekomendasi
**Pakai Cara 1** kecuali kamu butuh custom CI step (lint, test, dll). Lebih simpel, tidak ada secret yang perlu di-maintain.
