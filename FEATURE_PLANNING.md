# Feature Planning — Portfolio Project

> **Diupdate:** Mei 2026
> **Stack saat ini:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · Radix UI · Rust (Axum) · PostgreSQL · SQLx · JWT
> **Arsitektur:** Next.js App Router (Frontend) + Axum REST API (Backend) + PostgreSQL + Loki/Promtail/Grafana (Logging)

---

## Daftar Isi

1. [Analisa State Saat Ini](#analisa-state-saat-ini)
2. [Status Per Sprint](#status-per-sprint)
3. [Sprint 1 — Quick Wins (Done)](#sprint-1--quick-wins-done)
4. [Sprint 2 — Core Features (Done)](#sprint-2--core-features-done)
5. [Sprint 3 — Power Features](#sprint-3--power-features)
6. [Sprint 4 — Game Changers](#sprint-4--game-changers)
7. [Sprint 5 — Dual UI + Terminal Gate (Done)](#sprint-5--dual-ui--terminal-gate-done)
8. [Backlog — Performance & Core Web Vitals](#backlog--performance--core-web-vitals)
9. [Catatan Teknis](#catatan-teknis)

---

## Analisa State Saat Ini

### Yang Sudah Ada

| Fitur                                          | Frontend                             | Backend                                                                             |
| ---------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------- |
| Standard landing (`/`)                         | Hero, sections, SiteNav              | —                                                                                   |
| Terminal-style interface (`/terminal`, gated)  | Lengkap + gate redirect              | `GET/POST /api/gate/*` (8 endpoints)                                                |
| Terminal gate (OTW-style puzzles L1–L3)        | `/gate`, `/gate/1-3`                 | Session store, verify/unlock, rate limit                                            |
| Blog system (CRUD)                             | Page + list + detail + `/admin/blog` | REST API + HTML sanitization                                                        |
| Blog tags (denormalized `TEXT[]`)              | TagFilter + TagChip                  | `?tag=` filter + `GET /api/blog/tags`                                               |
| Blog search (basic ILIKE on title/summary)     | Search form di list                  | `?search=` filter di `BlogListQuery`                                                |
| Reading time                                   | Tampil di list & detail              | Column `reading_time_minutes` + `calculate_reading_time`                            |
| Blog view counter                              | Tampil di detail                     | Auto-increment di `GET /api/blog/:slug`                                             |
| Blog scheduling (`publishAt`)                  | Datetime picker + badges             | Query-time filter + `BlogPost::status()`                                            |
| RSS feed                                       | Link di header & layout              | `GET /api/rss`                                                                      |
| Auth (JWT + refresh via HttpOnly cookie)       | Admin login/register                 | bcrypt + token rotation + tower-governor rate limit                                 |
| TOTP 2FA admin                                 | Setup + login challenge              | `src/routes/twofa.rs` + auth challenge flow                                         |
| Contact form + admin inbox                     | `/contact`, `/admin/messages`        | `POST /api/contact`, CRUD `/api/admin/messages`                                     |
| Portfolio sections (skills/projects/exp/about) | Static + dynamic data                | DB-backed + fallback                                                                |
| TipTap WYSIWYG blog editor + image upload      | `TiptapEditor` + upload              | `POST/DELETE /api/upload/image`                                                     |
| Blog series / locale content                   | `/blog/series`, locale UI            | Series + i18n APIs                                                                  |
| Portfolio version history                      | `/admin/portfolio`                   | Snapshots + restore API                                                             |
| Keyboard shortcut modal + history panel        | Wired in `terminal.tsx`              | —                                                                                   |
| Table of contents (desktop sidebar)            | Sticky sidebar + heading IDs         | —                                                                                   |
| Admin inbox bulk actions                       | Checkbox toolbar                     | `PATCH/DELETE /api/admin/messages/bulk`                                             |
| Visitor analytics (Grafana)                    | Pageview beacon + admin link         | Prometheus `/metrics`, pageview API                                                 |
| GitHub stats proxy                             | `github-service.ts` → BE             | `/api/github/*`                                                                     |
| Live playground                                | `/playground` Sandpack               | Snippets API optional                                                               |
| Newsletter                                     | Footer + admin broadcast             | Subscribe/confirm/broadcast                                                         |
| Headless CMS                                   | `/admin/cms` docs                    | `/api/v1/content/*` + API keys                                                      |
| AI assistant (Gemini)                          | Chat widget + `ask` cmd              | `/api/ai/chat` SSE                                                                  |
| Visitor presence                               | Nav badge                            | `WS /ws/presence`                                                                   |
| Full CLI (pipe, chains)                        | `command-parser.ts`                  | —                                                                                   |
| i18n (multi-language UI)                       | hooks/utils                          | —                                                                                   |
| PWA support                                    | sw.js + manifest                     | —                                                                                   |
| Logging stack                                  | pino                                 | Loki/Promtail/Grafana + structured tracing                                          |
| Theme (dark/light)                             | next-themes                          | —                                                                                   |
| Tours/Onboarding                               | components                           | —                                                                                   |
| SEO (sitemap/robots/OG)                        | Lengkap                              | —                                                                                   |
| Terminal commands (~15 + `blog`)               | command-registry                     | —                                                                                   |
| OpenAPI / Swagger                              | Admin link to `/api/docs`            | Full spec (upload, gate, logs, roadmap)                                             |
| Health check                                   | —                                    | `/health`, `/health/detailed`, `/health/database`, `/health/redis`, `/health/ready` |
| Roadmap.sh proxy                               | `/roadmap` page                      | `/api/roadmap/*`                                                                    |
| Client log ingestion                           | pino transport                       | `POST /api/logs` (rate-limited, redacted)                                           |
| Image optimization (AVIF/WebP, `next/image`)   | `optimized-image.tsx`                | `next.config.ts` `images.formats`, remotePatterns                                   |
| Font loading (`display: swap`)                 | `next/font` di root layout           | `src/app/layout.tsx` (`JetBrains_Mono`, `display: "swap"`)                          |
| Prefetch / preload helpers                     | Theme JSON prefetch, font preload    | `src/lib/utils/bundler-optimization.ts`                                             |
| Core Web Vitals RUM + thresholds               | `WebVitalsMonitor` di layout         | `src/lib/logger/web-vitals.ts` (LCP/INP/CLS/FCP/TTFB → pino/Loki)                   |
| Bundle analysis (dev)                          | `ANALYZE=true bun run build`         | `@next/bundle-analyzer` di `next.config.ts`                                         |

### Gap yang Masih Ada

- **Optional:** `tsvector` full-text search upgrade (#13) jika blog >100 posts.
- **Ops:** CMS API key admin CRUD UI (saat ini docs + SQL template).
- **Ops:** Redis-backed rate limiting + presence when `REDIS_URL` is set on Cloud Run.
- **Performance:** RSC lebih luas di route non-interaktif; budget bundle `<100KB` initial + CI gate belum ada (lihat [Backlog — Performance & Core Web Vitals](#backlog--performance--core-web-vitals)).
- **Performance:** CWV sudah dimonitor (RUM), tapi belum ada sprint optimisasi aktif untuk menjamin LCP/INP/CLS di semua route utama.

> Semua gap checklist master plan (Sprint 1–5, #14–#32) sudah ditutup Mei 2026. Lihat `docs/features/FEATURE_21`–`FEATURE_32`.

> Catatan: blog tag saat ini pakai `TEXT[]` denormalized (lebih simpel). Search pakai ILIKE basic — tidak pakai `tsvector` full-text search. Keduanya bisa ditingkatkan ke join table + tsvector kalau diperlukan, tapi sudah berfungsi untuk skala saat ini.

---

## Status Per Sprint

| Sprint   | Tema                    | Status                         |
| -------- | ----------------------- | ------------------------------ |
| Sprint 1 | Polish & Discovery      | **DONE** (10/10)               |
| Sprint 2 | Core Portfolio Features | **DONE** (5/5 + bulk inbox)    |
| Sprint 3 | Power Features          | **DONE** (#14 TipTap, #17–#26) |
| Sprint 4 | Game Changers           | **DONE** (#27–#32)             |
| Sprint 5 | Dual UI + Terminal Gate | **DONE** (14/14)               |

---

## Sprint 1 — Quick Wins (Done)

> Semua item di sprint ini sudah selesai. Bagian ini disimpan sebagai referensi historis dan bukti konformitas.

| #   | Fitur                       | Status | Lokasi                                                                                                                                                      |
| --- | --------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Reading time estimator      | DONE   | BE: `src/db/models.rs` (`reading_time_minutes`), `src/routes/blog.rs::calculate_reading_time` · FE: `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx` |
| 2   | Copy code button            | DONE   | `src/components/molecules/blog/copy-code-button.tsx`                                                                                                        |
| 3   | Social share buttons        | DONE   | `src/components/molecules/blog/share-buttons.tsx`                                                                                                           |
| 4   | Blog view counter           | DONE   | BE auto-increment di `GET /api/blog/:slug` (`src/routes/blog.rs:319`); FE display `viewCount`                                                               |
| 5   | Scroll progress bar         | DONE   | `src/components/molecules/blog/scroll-progress.tsx`                                                                                                         |
| 6   | Keyboard shortcut modal     | DONE   | `terminal.tsx` + `HistorySearchPanel`; `Ctrl+?`, `Ctrl+R`                                                                                                   |
| 7   | Command history persistence | DONE   | `src/hooks/use-command-history.ts` — localStorage key `-terminal-history`, max 500 entries, with analytics                                                  |
| 8   | Table of Contents           | DONE   | `src/components/molecules/blog/table-of-contents.tsx`                                                                                                       |
| 9   | RSS Feed                    | DONE   | BE `GET /api/rss` di `src/routes/rss.rs`; FE link di blog list & layout                                                                                     |
| 10  | Back to top                 | DONE   | `src/components/molecules/blog/back-to-top.tsx`                                                                                                             |

---

## Sprint 2 — Core Features (Done)

Sprint 2 fokus pada fitur produktif yang langsung dipakai recruiter/visitor: contact flow, scheduling, 2FA, dan dokumentasi API.

> Semua 5 prioritas sudah landed. Bagian di bawah disimpan sebagai referensi
> bukti konformitas: ringkasan implementasi + lokasi kode aktual ada di
> tabel di bawah.

| #   | Fitur                         | Status | Lokasi                                                                                                                                                                                                                                                                                                                                     |
| --- | ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 11  | Contact form + storage        | DONE   | BE: `src/routes/contact.rs::submit_contact_message`, `src/db/mod.rs` (table `contact_messages`), email boundary di `src/email.rs` · FE: `src/app/contact/page.tsx`, `src/lib/services/contact-service.ts`                                                                                                                                  |
| 19  | Admin messages inbox          | DONE   | BE: `list_messages` / `get_message` / `update_message` / `delete_message` di `src/routes/contact.rs` · FE: `src/app/admin/messages/page.tsx`, `src/lib/services/admin-messages-service.ts`                                                                                                                                                 |
| 15  | Blog scheduling (`publishAt`) | DONE   | BE: kolom `publish_at` di `blog_posts`, `BlogPost::status()` di `src/db/models.rs`, public-list filter di `src/routes/blog.rs::fetch_blog_list` · FE: datetime picker + status badge di `src/components/molecules/admin/blog-editor.tsx`                                                                                                   |
| 16  | TOTP 2FA admin login          | DONE   | BE: `src/routes/twofa.rs` (setup/verify/disable/login challenge + status), challenge-token integration di `src/routes/auth.rs::login` · FE: `src/lib/auth/auth-service.ts::complete2FALogin`, `src/components/molecules/admin/terminal-login-form.tsx` (challenge step), `src/app/admin/2fa/page.tsx`, `src/lib/services/twofa-service.ts` |
| 20  | OpenAPI / Swagger docs        | DONE   | BE: `src/openapi.rs` + `#[utoipa::path]` annotations di handler auth/blog/portfolio/contact/twofa/health/rss, mount Swagger UI di `src/lib.rs` (`/api/docs`, raw spec di `/api/docs/openapi.json`); guarded oleh env `ENABLE_SWAGGER_UI` (default `true`)                                                                                  |

### Bukti konformitas singkat

- `cargo test --lib` hijau (**106 tests** per verifikasi Mei 2026).
- `cargo clippy --all-targets -- -D warnings` clean.
- `curl /api/docs/openapi.json` mengembalikan 23 paths dan 39 schemas dengan tag `Authentication`, `Two-Factor Auth`, `Blog`, `Portfolio`, `Contact`, `Health`, `RSS`.
- Frontend `tsc --noEmit` clean; `qrcode.react` ditambahkan sebagai dep eksklusif untuk halaman admin 2FA.

### Detail lama (untuk konteks histor[is], tetap valid)

### Priority 1 — Contact Form + Message Storage (#11)

**Backend:**

- Tabel `contact_messages` (name, email, subject, message, ip, read, created_at).
- `POST /api/contact` dengan validasi input + rate limit per IP via `tower-governor`.
- Email delivery via boundary trait (SMTP/Resend), agar bisa diganti tanpa rewrite handler.
- Sanitisasi pesan masuk (HTML stripping) sebelum simpan.

**Frontend:**

- `src/app/contact/page.tsx` dengan form validation lokal.
- Toast feedback (Sonner sudah tersedia).
- Optional: command terminal `contact` untuk navigasi.

**Acceptance:** Visitor bisa kirim pesan, pesan tersimpan ke DB, optional email notif terkirim.

### Priority 2 — Admin Messages Inbox (#19, depends on #11)

**Backend:**

- `GET /api/admin/messages` (paginated, admin auth).
- `PATCH /api/admin/messages/:id` mark read/unread.
- `DELETE /api/admin/messages/:id`.

**Frontend:**

- Halaman inbox di area admin yang aktif (bukan `/admin/dashboard` legacy yang sudah dihapus).
- Tabel list + detail panel + bulk actions (mark read, delete).

**Acceptance:** Admin bisa melihat, baca, mark read, dan hapus pesan kontak.

### Priority 3 — Blog Scheduling (#15)

**Backend:**

- Tambah kolom `publish_at TIMESTAMPTZ NULL` di `blog_posts`.
- Update `CreateBlogRequest` / `UpdateBlogRequest` untuk menerima `publishAt`.
- Public list filter: `published = true OR (publish_at IS NOT NULL AND publish_at <= now())`.
- Status derivation: `draft | scheduled | published` di response.
- MVP: tidak perlu background scheduler — query-time derivation sudah cukup.

**Frontend:**

- Date/time picker di form admin blog.
- Badge "Scheduled" / "Draft" / "Published" di list admin.

**Acceptance:** Admin bisa set `publishAt` ke masa depan, post otomatis tampil ke public setelah waktu lewat.

### Priority 4 — 2FA Admin Login (#16)

**Backend:**

- Crate `totp-rs` (latest).
- Kolom baru di `admin_users`: `totp_secret TEXT`, `totp_enabled BOOLEAN DEFAULT false`, `totp_backup_codes TEXT[]`.
- Endpoint `POST /api/auth/2fa/setup` — generate secret, return otpauth URI + backup codes.
- Endpoint `POST /api/auth/2fa/verify` — verify TOTP, enable 2FA.
- Endpoint `POST /api/auth/2fa/disable` (require password + TOTP).
- Modifikasi login: kalau `totp_enabled`, return `requires2fa: true` + temporary challenge token, JANGAN issue access/refresh sebelum TOTP verified.

**Frontend:**

- Step kedua di login flow: input 6-digit kode.
- Setup screen di admin settings (QR code via `qrcode` lib + secret + backup codes).

**Acceptance:** Admin bisa enable/disable 2FA, login flow memaksa TOTP kalau enabled, backup codes bisa dipakai sekali.

### Priority 5 — OpenAPI / Swagger Docs (#20)

**Backend:**

- Crate `utoipa` + `utoipa-swagger-ui` (atau `utoipa-redoc`).
- Annotate `auth`, `blog`, `portfolio`, `upload`, `contact`, `admin/messages`, `health`.
- Mount `/api/docs` di development; di production guard via env flag atau auth.
- Schema export ke `openapi.json` untuk konsumsi tooling.

**Acceptance:** `/api/docs` menampilkan Swagger UI dengan semua endpoint utama, request/response schema, dan auth requirement yang akurat.

---

## Sprint 3 — Power Features

> Sprint 2 & 5 selesai. Dua item Sprint 3 sudah mulai mendarat di codebase.

| #   | Fitur                                | Status  | Lokasi                                                  |
| --- | ------------------------------------ | ------- | ------------------------------------------------------- |
| 14  | Rich text editor admin blog (TipTap) | DONE    | `tiptap-editor.tsx`, `blog-editor.tsx`                  |
| 17  | Image upload integrated to editor    | DONE    | `image-upload-button.tsx`                               |
| 21  | Visitor analytics (Grafana)          | DONE    | `pageview-beacon.tsx`, `metrics.rs`, Grafana dashboard  |
| 22  | Spotify now playing                  | RETIRED | Removed from backend + frontend (May 2026); not planned |
| 23  | Blog series / collections            | DONE    | `series-service.ts`, `/blog/series/[slug]`              |
| 24  | Portfolio versioning                 | DONE    | `/admin/portfolio`, `portfolio_versions` table          |
| 25  | Multi-language blog content          | DONE    | `locales.ts`, locale switcher, `?locale=`               |
| 26  | GitHub stats proxy backend           | DONE    | `routes/github.rs`, proxy in `github-service.ts`        |

Catatan: `tsvector` full-text upgrade (#13 advanced) bisa masuk ke sprint ini jika search basic ILIKE sudah tidak cukup.

---

## Sprint 4 — Game Changers (Done)

| #   | Fitur                                  | Status | Lokasi                                          |
| --- | -------------------------------------- | ------ | ----------------------------------------------- |
| 27  | AI Portfolio Assistant (Gemini)        | DONE   | `ai-chat-widget.tsx`, `routes/ai.rs`            |
| 28  | Live coding / demo environment         | DONE   | `/playground`, Sandpack                         |
| 29  | Newsletter & email subscription        | DONE   | `/admin/newsletter`, `routes/newsletter.rs`     |
| 30  | Real-time visitor presence             | DONE   | `visitor-presence-badge.tsx`, `WS /ws/presence` |
| 31  | Full CLI experience (pipe, alias, etc) | DONE   | `command-parser.ts` pipe + `&&`/`;`             |
| 32  | Headless Portfolio CMS mode            | DONE   | `/admin/cms`, `/api/v1/content/*`               |

---

## Sprint 5 — Dual UI + Terminal Gate (Done)

Verifikasi codebase Mei 2026 — frontend + backend.

| #   | Item                                         | FE   | BE   | Lokasi                                                                                         |
| --- | -------------------------------------------- | ---- | ---- | ---------------------------------------------------------------------------------------------- |
| 1   | Standard landing at `/`                      | Done | —    | `src/app/page.tsx`, `src/components/organisms/landing/*`, `StandardPageLayout`                 |
| 2   | Terminal at `/terminal` (noindex)            | Done | —    | `src/app/terminal/page.tsx`                                                                    |
| 3   | Gate guard (proxy, cookie, bypass)           | Done | —    | `src/proxy.ts`, `src/proxy/test/proxy.test.ts`                                                 |
| 4   | Gate puzzles L1–L3 UI                        | Done | —    | `src/app/gate/page.tsx`, `/gate/1-3`, `src/components/organisms/gate/*`                        |
| 5   | Gate API (status/verify/unlock + challenges) | —    | Done | `src/routes/gate.rs`, 8 routes di `src/lib.rs`                                                 |
| 6   | SiteNav + SiteFooter + shared pages          | Done | —    | `src/components/layout/site-nav.tsx`, `site-footer.tsx`; blog/projects/contact/roadmap wrapped |
| 7   | Canonical social links                       | Done | —    | `src/lib/data/social-links.ts`                                                                 |
| 8   | URL helpers (`getApiUrl`, `getSiteUrl`)      | Done | —    | `src/lib/api/get-api-url.ts`, `get-site-url.ts`                                                |
| 9   | `.env.example` both repos                    | Done | Done | `portfolio-frontend/.env.example`, `portfolio-backend/.env.example`                            |
| 10  | Blog draft slug leak fix                     | —    | Done | `src/routes/blog.rs` — public `get_post` + admin bypass                                        |
| 11  | Admin blog page + terminal `blog` command    | Done | —    | `src/app/admin/blog/page.tsx`, `src/lib/commands/blog-commands.ts`                             |
| 12  | Orphan cleanup + unused Radix prune          | Done | —    | ~22 files removed; 26 `@radix-ui/*` packages dropped                                           |
| 13  | SEO (sitemap/robots) dual-route aware        | Done | —    | `src/app/sitemap.ts`, `src/app/robots.ts`                                                      |
| 14  | E2E specs                                    | Done | —    | `e2e/landing.spec.ts`, `e2e/gate.spec.ts`                                                      |

Docs: [docs/dual-ui-gate.md](./docs/dual-ui-gate.md) · [docs/dual-ui-gate-implementation-checklist.md](./docs/dual-ui-gate-implementation-checklist.md)

---

## Backlog — Performance & Core Web Vitals

> Sprint performance Mei 2026 — lihat [docs/features/FEATURE_33_PERFORMANCE.md](./docs/features/FEATURE_33_PERFORMANCE.md) dan [docs/performance/BASELINE.md](./docs/performance/BASELINE.md).

### Frontend performance

| Item                                | Status      | Lokasi / catatan                                                  |
| ----------------------------------- | ----------- | ----------------------------------------------------------------- |
| Image optimization pipeline         | **DONE**    | `next.config.ts`, `optimized-image.tsx`, `project-card-image.tsx` |
| Font loading (`font-display: swap`) | **DONE**    | `src/app/layout.tsx` — `next/font/google`                         |
| Prefetch / resource hints           | **DONE**    | `bundler-optimization.ts` wired via `client-only-components.tsx`  |
| PPR / `cacheComponents`             | **DONE**    | `next.config.ts`; cached blog di `cached-blog-fetch.ts`           |
| React Server Components             | **PARTIAL** | Hero/projects server-side; terminal/admin/playground client-heavy |
| Bundle size per-route CI            | **DONE**    | `transferwise/actions-next-bundle-analyzer` + `perf:analyze`      |
| Dynamic heavy deps                  | **DONE**    | Sandpack, TipTap, deferred AiChat                                 |

### Core Web Vitals optimization

| Item                                   | Status        | Lokasi / catatan                                      |
| -------------------------------------- | ------------- | ----------------------------------------------------- |
| Dual RUM (Loki + Vercel)               | **DONE**      | `web-vitals.ts` + `@vercel/speed-insights`            |
| Threshold LCP/INP/CLS + route field    | **DONE**      | `web-vitals.ts`; Grafana `grafana-cwv-dashboard.json` |
| Lighthouse CI                          | **DONE**      | `lighthouserc.js`, CI job `perf`                      |
| Landing LCP (server hero + OG preload) | **DONE**      | `hero-section.tsx`, `page.tsx`                        |
| FID                                    | **N/A → INP** | `web-vitals` v5                                       |

**Acceptance:** Monitor via Lighthouse CI (warn) + Loki/Grafana + Vercel Speed Insights; tune thresholds in `BASELINE.md` after production data.

---

## Catatan Teknis

### Backend (Rust/Axum)

**Dependencies yang akan dibutuhkan untuk Sprint 2:**

```toml
# Sprint 2 Priority 1 — email delivery boundary
# Pilih salah satu (atau dua sekaligus via trait):
lettre = { version = "0.11", features = ["tokio1-rustls-tls"] }
# atau pakai HTTP-based provider (Resend/SendGrid) via reqwest yang sudah ada

# Sprint 2 Priority 4 — TOTP
totp-rs = { version = "5", features = ["gen_secret"] }

# Sprint 2 Priority 5 — OpenAPI
utoipa = { version = "5", features = ["axum_extras", "chrono", "uuid"] }
utoipa-swagger-ui = { version = "8", features = ["axum"] }
```

**Migration pattern:** Saat ini migrations dijalankan inline di `src/db/mod.rs::run_migrations`. Untuk Sprint 2 tetap pakai pattern ini (sudah punya retry & multi-statement support via `sqlx::raw_sql`). Migrasi ke folder `migrations/` + `sqlx migrate run` bisa dilakukan terpisah ketika jumlah migrasi sudah lebih dari 20.

**Rate limiting:** Sudah pakai `tower-governor` dengan `SmartIpKeyExtractor` (parses `X-Forwarded-For`). Endpoint baru di Sprint 2 (`/api/contact`, admin endpoints) sebaiknya pakai layer governor terpisah dengan budget yang sesuai konteks.

**Index recommendations untuk Sprint 2:**

```sql
-- Untuk contact_messages
CREATE INDEX contact_messages_created_at_idx ON contact_messages (created_at DESC);
CREATE INDEX contact_messages_read_idx ON contact_messages (read, created_at DESC);

-- Untuk blog scheduling
CREATE INDEX blog_posts_publish_at_idx ON blog_posts (publish_at) WHERE publish_at IS NOT NULL;
```

### Frontend (Next.js/React)

**Pattern yang harus diikuti:**

- Server-side data fetching via Server Components / `lib/services/`. **TanStack Query sudah dihapus** dari deps — gunakan native `fetch` atau React 19 `use()` hook.
- Form validation dengan Zod + react-hook-form (sudah tersedia).
- Toast notifications via Sonner (sudah tersedia).
- Komponen baru mengikuti Atomic Design: `atoms/` → `molecules/` → `organisms/`.
- Auth state via HttpOnly cookies — TIDAK PERNAH simpan refresh token di sessionStorage/localStorage. Pakai `credentials: "include"` di setiap fetch ke endpoint admin.

**Environment variables yang akan dibutuhkan untuk Sprint 2:**

```env
# Contact form (#11) — pilih satu transport:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=app-password
CONTACT_EMAIL=your@email.com
# atau
RESEND_API_KEY=re_xxx
RESEND_FROM=noreply@yourdomain.com

# 2FA (#16)
TOTP_ISSUER=infinitedim.vercel.app

# OpenAPI (#20)
ENABLE_API_DOCS=true   # set false di production jika tidak ingin public
```

### DevOps / Infrastructure

- Redis di ops VM + local `docker-compose.yml`; backend uses it for rate limiting and presence when `REDIS_URL` is set (roadmap/GitHub cache still in-memory).
- CDN untuk uploads bisa dipertimbangkan ketika folder `/uploads/` mulai membesar (>1GB).
- pgvector extension dibutuhkan kalau implementasi AI assistant (#27).

---

## Kesimpulan

Semua sprint (1–5) dan fitur #6–#32 dari master plan sudah diimplementasi (Mei 2026).

**Verifikasi:** `cargo test --lib` (135 tests), `bun run type-check`, docs di `docs/features/FEATURE_21`–`FEATURE_32`.

**Setup production:** isi env vars di `.env.example` (Gemini, Grafana URL, CMS keys, gate answers).
