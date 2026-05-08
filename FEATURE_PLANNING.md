# Feature Planning — Portfolio Project

> **Diupdate:** Mei 2026
> **Stack saat ini:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · Radix UI · Rust (Axum) · PostgreSQL · SQLx · JWT
> **Arsitektur:** Next.js App Router (Frontend) + Axum REST API (Backend) + PostgreSQL + Loki/Promtail/Grafana (Logging)

---

## Daftar Isi

1. [Analisa State Saat Ini](#analisa-state-saat-ini)
2. [Status Per Sprint](#status-per-sprint)
3. [Sprint 1 — Quick Wins (Done)](#sprint-1--quick-wins-done)
4. [Sprint 2 — Core Features (Aktif)](#sprint-2--core-features-aktif)
5. [Sprint 3 — Power Features](#sprint-3--power-features)
6. [Sprint 4 — Game Changers](#sprint-4--game-changers)
7. [Catatan Teknis](#catatan-teknis)

---

## Analisa State Saat Ini

### Yang Sudah Ada

| Fitur                                          | Frontend                | Backend                                                 |
| ---------------------------------------------- | ----------------------- | ------------------------------------------------------- |
| Terminal-style interface                       | Lengkap                 | —                                                       |
| Blog system (CRUD)                             | Page + list + detail    | REST API + HTML sanitization                            |
| Blog tags (denormalized `TEXT[]`)              | TagFilter + TagChip     | `?tag=` filter + `GET /api/blog/tags`                   |
| Blog search (basic ILIKE on title/summary)     | Search form di list     | `?search=` filter di `BlogListQuery`                    |
| Reading time                                   | Tampil di list & detail | Column `reading_time_minutes` + `calculate_reading_time` |
| Blog view counter                              | Tampil di detail        | Auto-increment di `GET /api/blog/:slug`                 |
| RSS feed                                       | Link di header & layout | `GET /api/rss`                                          |
| Auth (JWT + refresh via HttpOnly cookie)       | Admin login/register    | bcrypt + token rotation + tower-governor rate limit     |
| Portfolio sections (skills/projects/exp/about) | Static + dynamic data   | DB-backed + fallback                                    |
| Image upload                                   | (belum diintegrasikan)  | `POST/DELETE /api/upload/image` (multipart)             |
| Admin dashboard                                | Login + register page   | CRUD endpoints                                          |
| Giscus comments                                | `<GiscusComments>`      | — (third-party widget)                                  |
| Copy code button                               | `<CopyCodeButton>`      | —                                                       |
| Share buttons                                  | `<ShareButtons>`        | —                                                       |
| Scroll progress bar                            | `<ScrollProgress>`      | —                                                       |
| Table of contents                              | `<TableOfContents>`     | —                                                       |
| Back to top                                    | `<BackToTop>`           | —                                                       |
| Keyboard shortcut modal                        | `Ctrl+?` opens panel    | —                                                       |
| Command history persistence                    | `localStorage` (500 entries, with analytics) | —                                          |
| GitHub integration (frontend-direct)           | `github-service.ts`     | — (FE hits GitHub API langsung)                         |
| i18n (multi-language UI)                       | hooks/utils             | —                                                       |
| PWA support                                    | sw.js + manifest        | —                                                       |
| Logging stack                                  | pino                    | Loki/Promtail/Grafana + structured tracing              |
| Theme (dark/light)                             | next-themes             | —                                                       |
| Tours/Onboarding                               | components              | —                                                       |
| SEO (sitemap/robots/OG)                        | Lengkap                 | —                                                       |
| Terminal commands (~15)                        | command-registry        | —                                                       |
| Health check                                   | —                       | `/health`, `/health/detailed`, `/health/database`, `/health/redis`, `/health/ready` |
| Roadmap.sh proxy                               | —                       | `/api/roadmap/*`                                        |
| Client log ingestion                           | pino transport          | `POST /api/logs` (rate-limited, redacted)               |

### Gap yang Masih Ada

- Belum ada **rich text editor** untuk admin blog (saat ini textarea biasa) (#14).
- Belum ada **integrasi image upload ke editor** (endpoint backend siap, FE belum pakai) (#17).
- Belum ada **analytics dashboard** real (#21).
- Belum ada **Spotify**, **GitHub stats proxy backend**, **blog series**, **versioning**, **i18n content** (#22, #23, #24, #25, #26).
- Game changers: AI assistant, live playground, newsletter, presence, full CLI, headless CMS (#27–#32).

> Catatan: blog tag saat ini pakai `TEXT[]` denormalized (lebih simpel). Search pakai ILIKE basic — tidak pakai `tsvector` full-text search. Keduanya bisa ditingkatkan ke join table + tsvector kalau diperlukan, tapi sudah berfungsi untuk skala saat ini.

---

## Status Per Sprint

| Sprint   | Tema                  | Status      |
| -------- | --------------------- | ----------- |
| Sprint 1 | Polish & Discovery    | **DONE** (10/10 quick wins selesai) |
| Sprint 2 | Core Portfolio Features | **DONE** (5/5 fitur prioritas selesai) |
| Sprint 3 | Power Features        | Belum mulai |
| Sprint 4 | Game Changers         | Belum mulai |

---

## Sprint 1 — Quick Wins (Done)

> Semua item di sprint ini sudah selesai. Bagian ini disimpan sebagai referensi historis dan bukti konformitas.

| #  | Fitur                       | Status | Lokasi                                                                            |
| -- | --------------------------- | ------ | --------------------------------------------------------------------------------- |
| 1  | Reading time estimator      | DONE   | BE: `src/db/models.rs` (`reading_time_minutes`), `src/routes/blog.rs::calculate_reading_time` · FE: `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx` |
| 2  | Copy code button            | DONE   | `src/components/molecules/blog/copy-code-button.tsx`                              |
| 3  | Social share buttons        | DONE   | `src/components/molecules/blog/share-buttons.tsx`                                 |
| 4  | Blog view counter           | DONE   | BE auto-increment di `GET /api/blog/:slug` (`src/routes/blog.rs:319`); FE display `viewCount` |
| 5  | Scroll progress bar         | DONE   | `src/components/molecules/blog/scroll-progress.tsx`                               |
| 6  | Keyboard shortcut modal     | DONE   | Panel + `Ctrl+?` shortcut via `src/hooks/use-terminal-shortcuts.ts` + `terminal-features-integration.tsx` |
| 7  | Command history persistence | DONE   | `src/hooks/use-command-history.ts` — localStorage key `-terminal-history`, max 500 entries, with analytics |
| 8  | Table of Contents           | DONE   | `src/components/molecules/blog/table-of-contents.tsx`                             |
| 9  | RSS Feed                    | DONE   | BE `GET /api/rss` di `src/routes/rss.rs`; FE link di blog list & layout           |
| 10 | Back to top                 | DONE   | `src/components/molecules/blog/back-to-top.tsx`                                   |

---

## Sprint 2 — Core Features (Done)

Sprint 2 fokus pada fitur produktif yang langsung dipakai recruiter/visitor: contact flow, scheduling, 2FA, dan dokumentasi API.

> Semua 5 prioritas sudah landed. Bagian di bawah disimpan sebagai referensi
> bukti konformitas: ringkasan implementasi + lokasi kode aktual ada di
> tabel di bawah.

| #  | Fitur                       | Status | Lokasi                                                                                                |
| -- | --------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| 11 | Contact form + storage      | DONE   | BE: `src/routes/contact.rs::submit_contact_message`, `src/db/mod.rs` (table `contact_messages`), email boundary di `src/email.rs` · FE: `src/app/contact/page.tsx`, `src/lib/services/contact-service.ts` |
| 19 | Admin messages inbox        | DONE   | BE: `list_messages` / `get_message` / `update_message` / `delete_message` di `src/routes/contact.rs` · FE: `src/app/admin/messages/page.tsx`, `src/lib/services/admin-messages-service.ts` |
| 15 | Blog scheduling (`publishAt`) | DONE | BE: kolom `publish_at` di `blog_posts`, `BlogPost::status()` di `src/db/models.rs`, public-list filter di `src/routes/blog.rs::fetch_blog_list` · FE: datetime picker + status badge di `src/components/molecules/admin/blog-editor.tsx` |
| 16 | TOTP 2FA admin login        | DONE   | BE: `src/routes/twofa.rs` (setup/verify/disable/login challenge + status), challenge-token integration di `src/routes/auth.rs::login` · FE: `src/lib/auth/auth-service.ts::complete2FALogin`, `src/components/molecules/admin/terminal-login-form.tsx` (challenge step), `src/app/admin/2fa/page.tsx`, `src/lib/services/twofa-service.ts` |
| 20 | OpenAPI / Swagger docs      | DONE   | BE: `src/openapi.rs` + `#[utoipa::path]` annotations di handler auth/blog/portfolio/contact/twofa/health/rss, mount Swagger UI di `src/lib.rs` (`/api/docs`, raw spec di `/api/docs/openapi.json`); guarded oleh env `ENABLE_SWAGGER_UI` (default `true`) |

### Bukti konformitas singkat

- `cargo test --lib` hijau (48 tests) setelah seluruh Sprint 2 mendarat.
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

> Direncanakan setelah Sprint 2 selesai.

| #  | Fitur                                | Effort (FE/BE)         |
| -- | ------------------------------------ | ---------------------- |
| 14 | Rich text editor admin blog          | 3 hari · 0 hari        |
| 17 | Image upload integrated to editor    | 2 hari · 0 hari (BE siap) |
| 21 | Real-time visitor analytics          | 5 hari · 8 hari        |
| 22 | Spotify Now Playing widget           | 2 hari · 3 hari        |
| 23 | Blog series / collections            | 3 hari · 3 hari        |
| 24 | Portfolio versioning & audit history | 4 hari · 4 hari        |
| 25 | Multi-language blog content          | 3 hari · 3 hari        |
| 26 | GitHub stats proxy backend           | 4 hari · 2 hari        |

Catatan: `tsvector` full-text upgrade (#13 advanced) bisa masuk ke sprint ini jika search basic ILIKE sudah tidak cukup.

---

## Sprint 4 — Game Changers

> Roadmap jangka panjang. Akan direvisi ulang setelah Sprint 2/3 selesai.

| #  | Fitur                                  | Effort (FE/BE) |
| -- | -------------------------------------- | -------------- |
| 27 | AI Portfolio Assistant (RAG + LLM)     | 5 · 14 hari    |
| 28 | Live coding / demo environment         | 7 · 14 hari    |
| 29 | Newsletter & email subscription system | 5 · 10 hari    |
| 30 | Real-time visitor presence (WebSocket) | 4 · 5 hari     |
| 31 | Full CLI experience (pipe, alias, etc) | 14 · 3 hari    |
| 32 | Headless Portfolio CMS mode            | 3 · 14 hari    |

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
TOTP_ISSUER=infinitedim.site

# OpenAPI (#20)
ENABLE_API_DOCS=true   # set false di production jika tidak ingin public
```

### DevOps / Infrastructure

- Redis sudah ada di `docker-compose.yml` tapi belum dipakai backend. Dependency `redis` perlu ditambahkan di `Cargo.toml` ketika fitur caching benar-benar dibutuhkan (Sprint 3+).
- CDN untuk uploads bisa dipertimbangkan ketika folder `/uploads/` mulai membesar (>1GB).
- pgvector extension dibutuhkan kalau implementasi AI assistant (#27).

---

## Kesimpulan

Sprint 1 sudah selesai sepenuhnya. Sprint 2 adalah fokus aktif berikutnya, dengan 5 fitur prioritas (contact form, inbox, scheduling, 2FA, OpenAPI) yang mencakup gap fungsional terbesar di portfolio saat ini.

Setelah Sprint 2 selesai, portfolio ini akan punya: contact flow yang nyata, admin operasional dengan inbox + scheduling, akun admin yang aman (2FA), dan dokumentasi API yang bisa dipakai consumer eksternal — fondasi yang siap untuk Sprint 3 (analytics, Spotify, GitHub proxy) dan Sprint 4 (AI assistant, presence, newsletter).
