# Deploy ke GitHub Pages

CI/CD via GitHub Actions: setiap push ke `main` akan auto-build & deploy ke GitHub Pages.

## ⚠️ Catatan Penting

Project ini berbasis **TanStack Start (SSR + server functions)**. GitHub Pages **hanya static hosting**, jadi:

- ✅ **Jalan**: UI, routing client-side, Supabase Auth/DB/Storage (langsung dari browser dengan anon key), Edge Functions (dipanggil via HTTPS).
- ❌ **Tidak jalan**: TanStack server functions (`createServerFn`), SSR, route loaders yang butuh server runtime.

Untuk full SSR (Cloudflare Workers, dsb.), gunakan **tombol Publish di Lovable** atau deploy ke Vercel/Cloudflare.

## Setup (sekali saja)

### 1. Push ke GitHub
Connect project ke GitHub via **Connectors → GitHub** di Lovable.

### 2. Aktifkan GitHub Pages
Repo → **Settings → Pages → Source: GitHub Actions**.

### 3. Tambahkan Repository Secrets
Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://bansjlfomenghvmwyjij.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | (anon key dari `.env`) |
| `VITE_SUPABASE_PROJECT_ID` | `bansjlfomenghvmwyjij` |

### 4. Push ke `main`
Workflow `.github/workflows/deploy.yml` akan jalan otomatis. Cek tab **Actions** di GitHub.

URL hasil: `https://<username>.github.io/<repo-name>/`

## Custom Domain (opsional)
Tambah file `public/CNAME` berisi domain kamu (misal `nusawallet.com`), lalu set DNS CNAME ke `<username>.github.io`.

## Troubleshooting

- **Asset 404**: pastikan repo bukan user-page (`<username>.github.io`); workflow set `BASE_PATH` otomatis dari nama repo.
- **Refresh = 404**: sudah di-handle via `404.html` fallback (SPA mode).
- **Auth gagal**: tambahkan URL GitHub Pages ke Supabase → Authentication → URL Configuration → Redirect URLs.
