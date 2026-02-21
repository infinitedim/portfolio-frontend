# 📋 Feature Planning — Portfolio Project

> **Dibuat:** 20 Februari 2026  
> **Stack saat ini:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · Radix UI · Rust (Axum) · PostgreSQL · SQLx · JWT  
> **Arsitektur:** Next.js App Router (Frontend) + Axum REST API (Backend) + PostgreSQL + Loki/Promtail/Grafana (Logging)

---

## 📖 Daftar Isi

1. [Analisa State Saat Ini](#-analisa-state-saat-ini)
2. [Fitur Kecil (Quick Wins)](#-fitur-kecil--quick-wins)
3. [Fitur Menengah](#-fitur-menengah)
4. [Fitur Besar](#-fitur-besar)
5. [Fitur Game Changer](#-fitur-game-changer)
6. [Prioritas & Timeline](#-prioritas--timeline)
7. [Catatan Teknis](#-catatan-teknis)

---

## 🔍 Analisa State Saat Ini

### ✅ Yang Sudah Ada

| Fitur                                          | Frontend                | Backend                         |
| ---------------------------------------------- | ----------------------- | ------------------------------- |
| Terminal-style interface                       | ✅ Lengkap              | —                               |
| Blog system (CRUD)                             | ✅ Page + list          | ✅ REST API + HTML sanitization |
| Auth (JWT + refresh)                           | ✅ Admin login/register | ✅ bcrypt + token rotation      |
| Portfolio sections (skills/projects/exp/about) | ✅ Static data          | ✅ DB-backed + fallback         |
| Admin dashboard                                | ✅ Login page           | ✅ CRUD endpoints               |
| GitHub integration                             | ✅ github-service.ts    | — (frontend only)               |
| i18n (multi-language)                          | ✅ hooks/utils          | —                               |
| PWA support                                    | ✅ sw.js + manifest     | —                               |
| Logging stack                                  | ✅ pino                 | ✅ Loki/Promtail/Grafana        |
| Theme (dark/light)                             | ✅ next-themes          | —                               |
| Tours/Onboarding                               | ✅ components           | —                               |
| SEO (sitemap/robots/OG)                        | ✅ Lengkap              | —                               |
| Terminal commands                              | ✅ ~15 commands         | —                               |
| Health check                                   | —                       | ✅ /health, /health/detailed    |

### ⚠️ Gap yang Teridentifikasi

- Blog belum punya **tags, search, komentar, read time, RSS feed**
- Tidak ada **contact/message form** yang terkoneksi ke backend
- Auth tidak punya **2FA, session management, atau audit log yang persisten**
- Tidak ada **analytics** nyata untuk visitor
- Terminal commands tidak tersimpan ke server (full client-side)
- Tidak ada endpoint **search** di backend
- Tidak ada **file upload** untuk gambar blog
- Portfolio sections masih **manual update** via API, belum ada rich editor

---

## 🟢 Fitur Kecil — Quick Wins

> Estimasi implementasi: **1–3 hari per fitur**. Impact langsung, risiko rendah.

---

### 1. Reading Time Estimator pada Blog Post

**Deskripsi:** Kalkulasi estimasi waktu baca berdasarkan jumlah kata konten Markdown.

**Frontend (`portfolio-frontend`):**

- Tambah fungsi utilitas `calculateReadingTime(markdown: string): string` di `src/lib/utils/`
- Tampilkan badge "5 min read" pada blog list (`src/app/blog/page.tsx`) dan detail post

**Backend (`portfolio-backend`):**

- Tambah field `reading_time_minutes: Option<i32>` di model `BlogPost` (computed, tidak disimpan)
- Atau hitung di frontend saja dari `content_md` yang sudah ada

**Effort:** FE: 2 jam · BE: 0 jam

---

### 2. Copy Code Button pada Blog Post

**Deskripsi:** Tombol copy clipboard muncul saat hover di setiap code block dalam blog.

**Frontend:**

- Buat komponen `CodeBlock` yang wraps `<pre><code>` dan inject button "Copy"
- Gunakan `navigator.clipboard.writeText()`
- Pasang sebagai custom renderer di Markdown parser

**Backend:** Tidak perlu perubahan.

**Effort:** FE: 3 jam · BE: 0 jam

---

### 3. Social Share Buttons untuk Blog Post

**Deskripsi:** Tombol share ke Twitter/X, LinkedIn, dan "Copy link" di halaman blog detail.

**Frontend:**

- Buat komponen `ShareButtons` di `src/components/molecules/blog/`
- Gunakan Web Share API sebagai primary, fallback ke direct URL share
- Tambahkan ke layout blog `[slug]/page.tsx`

**Backend:** Tidak perlu perubahan.

**Effort:** FE: 2 jam · BE: 0 jam

---

### 4. Blog Post View Counter

**Deskripsi:** Tracking jumlah view per artikel, ditampilkan di list dan detail.

**Frontend:**

- Fire-and-forget POST ke `/api/blog/:slug/view` saat halaman dimuat
- Tampilkan view count di header post

**Backend:**

- Tambah kolom `view_count: i64` di tabel `blog_posts`
- Endpoint `POST /api/blog/:slug/view` — increment counter (no auth diperlukan)
- Endpoint `GET /api/blog/:slug` sudah return data, tambahkan `view_count` di response

**Migration SQL:**

```sql
ALTER TABLE blog_posts ADD COLUMN view_count BIGINT NOT NULL DEFAULT 0;
```

**Effort:** FE: 2 jam · BE: 3 jam

---

### 5. Scroll Progress Bar

**Deskripsi:** Progress bar tipis di bagian atas halaman yang menunjukkan progress scroll artikel.

**Frontend:**

- Buat hook `useScrollProgress()` yang return persentase 0–100
- Render sebagai sticky `<div>` dengan `width: ${progress}%` di layout blog
- Gunakan CSS `transition` smooth

**Backend:** Tidak perlu perubahan.

**Effort:** FE: 1.5 jam · BE: 0 jam

---

### 6. Keyboard Shortcut Cheatsheet Modal

**Deskripsi:** Modal yang muncul ketika user menekan `?` atau `Ctrl+/`, menampilkan semua shortcut terminal yang tersedia.

**Frontend:**

- Buat komponen `ShortcutModal` di `src/components/molecules/terminal/`
- Extend `use-terminal-shortcuts.ts` untuk expose daftar shortcut
- Gunakan `@radix-ui/react-dialog` yang sudah ada

**Backend:** Tidak perlu perubahan.

**Effort:** FE: 2 jam · BE: 0 jam

---

### 7. Command History Persistence (localStorage)

**Deskripsi:** History command terminal tersimpan di `localStorage` agar persisten antar sesi (saat ini sudah ada `use-command-history.ts` tapi kemungkinan in-memory).

**Frontend:**

- Extend `use-command-history.ts` untuk sync ke `localStorage` dengan key `terminal:history`
- Batasi maksimal 100 entry terakhir
- Clear on logout admin

**Backend:** Tidak perlu perubahan.

**Effort:** FE: 2 jam · BE: 0 jam

---

### 8. Table of Contents Auto-Generated untuk Blog

**Deskripsi:** Sidebar atau in-page ToC yang auto-extract dari heading H2/H3 di konten blog.

**Frontend:**

- Buat fungsi `extractHeadings(html: string)` dari `content_html`
- Buat komponen `TableOfContents` dengan anchor links
- Sticky sidebar di `lg:` breakpoint

**Backend:** Tidak perlu perubahan.

**Effort:** FE: 3 jam · BE: 0 jam

---

### 9. RSS Feed untuk Blog

**Deskripsi:** Endpoint `/api/rss` yang menghasilkan RSS 2.0 XML dari published blog posts.

**Frontend:**

- Tambahkan `<link rel="alternate" type="application/rss+xml">` di `layout.tsx`

**Backend:**

- Tambah route `GET /api/rss` yang query published posts dan generate XML response
- Content-Type: `application/rss+xml`
- Cukup ~50 baris Rust

**Effort:** FE: 30 menit · BE: 2 jam

---

### 10. Tombol "Back to Top"

**Deskripsi:** Floating button yang muncul setelah scroll 400px, klik untuk smooth scroll ke atas.

**Frontend:**

- Hook `useScrollPosition()` untuk detect posisi
- Komponen `BackToTopButton` dengan animasi fade-in/out dari Tailwind

**Backend:** Tidak perlu perubahan.

**Effort:** FE: 1 jam · BE: 0 jam

---

## 🟡 Fitur Menengah

> Estimasi implementasi: **3–14 hari per fitur**. Membutuhkan koordinasi FE + BE.

📁 **Detail planning untuk setiap fitur menengah tersedia di [`docs/features/`](docs/features/):**

| #   | Fitur                | Detail Spec                                                                | Prioritas |
| --- | -------------------- | -------------------------------------------------------------------------- | --------- |
| 11  | Contact Form + Email | [FEATURE_11_CONTACT_FORM.md](docs/features/FEATURE_11_CONTACT_FORM.md)     | 🟡 Sedang |
| 12  | Blog Tags & Kategori | [FEATURE_12_BLOG_TAGS.md](docs/features/FEATURE_12_BLOG_TAGS.md)           | 🔴 Tinggi |
| 13  | Full-Text Search     | [FEATURE_13_SEARCH.md](docs/features/FEATURE_13_SEARCH.md)                 | 🔴 Tinggi |
| 14  | Rich Text Editor     | [FEATURE_14_RICH_EDITOR.md](docs/features/FEATURE_14_RICH_EDITOR.md)       | 🔴 Tinggi |
| 15  | Blog Scheduling      | [FEATURE_15_SCHEDULING.md](docs/features/FEATURE_15_SCHEDULING.md)         | 🟡 Sedang |
| 16  | 2FA Admin Login      | [FEATURE_16_2FA.md](docs/features/FEATURE_16_2FA.md)                       | 🔴 Tinggi |
| 17  | Image Upload         | [FEATURE_17_IMAGE_UPLOAD.md](docs/features/FEATURE_17_IMAGE_UPLOAD.md)     | 🔴 Tinggi |
| 18  | Giscus Comments      | [FEATURE_18_GISCUS.md](docs/features/FEATURE_18_GISCUS.md)                 | 🟡 Sedang |
| 19  | Messages Inbox       | [FEATURE_19_MESSAGES_INBOX.md](docs/features/FEATURE_19_MESSAGES_INBOX.md) | 🟡 Sedang |
| 20  | OpenAPI/Swagger      | [FEATURE_20_OPENAPI.md](docs/features/FEATURE_20_OPENAPI.md)               | 🟡 Sedang |

> Setiap file berisi: **subtask checklist**, **file mapping**, **API contract**, dan **acceptance criteria**.

---

### 11. Contact / Message Form dengan Email

> 📄 **[Lihat detail spec →](docs/features/FEATURE_11_CONTACT_FORM.md)**

**Deskripsi:** Form kontak yang mengirim pesan ke inbox developer via email. Ini adalah fitur penting yang biasanya dicari recruiter/client di portfolio.

**Frontend:**

- Buat halaman `src/app/contact/page.tsx`
- Form dengan fields: nama, email, subject, pesan
- Validasi Zod + react-hook-form (sudah ada dependensinya)
- Success/error state dengan Sonner toast
- Tambah command `contact` di terminal untuk navigate ke halaman ini

**Backend:**

- Tambah crate `lettre` untuk SMTP email
- Endpoint `POST /api/contact` — validasi input, rate limit (5/jam per IP), kirim email
- Config: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `CONTACT_EMAIL` di `.env`
- Simpan pesan ke tabel `contact_messages` (untuk arsip admin)

```sql
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  ip_address VARCHAR(45),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Effort:** FE: 1 hari · BE: 2 hari

---

### 12. Blog Tags & Kategori

> 📄 **[Lihat detail spec →](docs/features/FEATURE_12_BLOG_TAGS.md)**

**Deskripsi:** Tag system untuk blog posts agar bisa difilter berdasarkan topik.

**Frontend:**

- Tampilkan tag chips pada blog list dan detail
- Filter UI — klik tag untuk filter posts
- URL-based filter `?tag=rust`

**Backend:**

```sql
CREATE TABLE blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE blog_post_tags (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
```

- Update `BlogListQuery` untuk support `?tag=slug`
- Update `CreateBlogRequest` / `UpdateBlogRequest` untuk include `tags: Vec<String>`
- Endpoint `GET /api/blog/tags` untuk list semua tag

**Effort:** FE: 2 hari · BE: 2 hari

---

### 13. Full-Text Search untuk Blog & Projects

> 📄 **[Lihat detail spec →](docs/features/FEATURE_13_SEARCH.md)**

**Deskripsi:** Search bar yang bisa mencari artikel blog berdasarkan judul, konten, tag, dan juga mencari di daftar projects.

**Frontend:**

- Komponen `SearchModal` dengan keyboard shortcut `Ctrl+K`
- Debounced input dengan `use-debounced-value.ts` (sudah ada)
- Tampilkan hasil blog + projects dalam satu modal (à la Command Palette)
- Gunakan `cmdk` yang sudah ada di dependencies

**Backend:**

- Endpoint `GET /api/search?q=keyword&type=blog|project|all`
- Gunakan PostgreSQL full-text search dengan `tsvector` dan `tsquery`:

```sql
ALTER TABLE blog_posts ADD COLUMN search_vector TSVECTOR;
CREATE INDEX blog_posts_fts_idx ON blog_posts USING GIN(search_vector);
```

- Atau bisa gunakan `ILIKE` sebagai solusi sederhana awal

**Effort:** FE: 2 hari · BE: 2 hari

---

### 14. Admin: Rich Text / Markdown Editor

> 📄 **[Lihat detail spec →](docs/features/FEATURE_14_RICH_EDITOR.md)**

**Deskripsi:** Editor WYSIWYG/Markdown untuk membuat blog post di admin dashboard, menggantikan textarea biasa.

**Frontend:**

- Integrasikan editor seperti `@uiw/react-md-editor` atau `@tiptap/react`
- Preview live split-view (Markdown kiri, HTML preview kanan)
- Toolbar: bold, italic, heading, code, link, image URL
- Auto-save draft ke localStorage

**Backend:** Tidak perlu perubahan di endpoint, hanya menerima `content_md` seperti sekarang.

**Effort:** FE: 3 hari · BE: 0 hari

---

### 15. Blog Post Scheduling

> 📄 **[Lihat detail spec →](docs/features/FEATURE_15_SCHEDULING.md)**

**Deskripsi:** Admin bisa menjadwalkan artikel untuk publish otomatis di waktu tertentu.

**Frontend:**

- Tambah `DateTimePicker` di form create/edit post
- Field `publish_at` — jika diisi dan published=false, status tampil "Scheduled"

**Backend:**

```sql
ALTER TABLE blog_posts ADD COLUMN publish_at TIMESTAMPTZ;
```

- Tambah background task dengan `tokio::spawn` — setiap menit check posts dengan `publish_at <= NOW()` dan `published = false`, lalu set `published = true`
- Tampilkan status `scheduled` di API response

**Effort:** FE: 1 hari · BE: 2 hari

---

### 16. 2FA (TOTP) untuk Admin Login

> 📄 **[Lihat detail spec →](docs/features/FEATURE_16_2FA.md)**

**Deskripsi:** Two-Factor Authentication menggunakan TOTP agar admin login lebih aman.

**Frontend:**

- Flow tambahan setelah login: input 6-digit TOTP code
- QR code setup page dengan secret
- Backup codes display

**Backend:**

- Tambah crate `totp-rs`
- Kolom baru di `admin_users`: `totp_secret`, `totp_enabled`, `totp_backup_codes`
- Endpoint `POST /api/auth/2fa/setup` — generate secret + QR code
- Endpoint `POST /api/auth/2fa/verify` — verify TOTP code
- Modifikasi login flow: return `requires_2fa: true` jika enabled

**Effort:** FE: 2 hari · BE: 3 hari

---

### 17. Image Upload untuk Blog

> 📄 **[Lihat detail spec →](docs/features/FEATURE_17_IMAGE_UPLOAD.md)**

**Deskripsi:** Upload gambar langsung dari admin editor, tersimpan di server atau object storage.

**Frontend:**

- Drag-and-drop / click-to-upload di editor
- Preview thumbnail setelah upload
- Insert URL otomatis ke Markdown

**Backend:**

- Tambah crate `multer` atau gunakan `axum::extract::Multipart`
- Endpoint `POST /api/upload/image` (auth required)
- Simpan ke folder `/public/uploads/` atau integrasi S3-compatible (MinIO)
- Return URL untuk diinsert ke konten

**Effort:** FE: 2 hari · BE: 2 hari

---

### 18. Giscus / GitHub Discussions Comments

> 📄 **[Lihat detail spec →](docs/features/FEATURE_18_GISCUS.md)**

**Deskripsi:** Sistem komentar di blog menggunakan GitHub Discussions via Giscus — zero backend cost, login via GitHub.

**Frontend:**

- Install `giscus` embed di halaman blog detail `[slug]/page.tsx`
- Config repo, category, theme sync dengan dark/light mode
- Lazy load di bawah artikel

**Backend:** Tidak perlu perubahan (Giscus adalah third-party widget).

**Effort:** FE: 3 jam · BE: 0 jam  
_(Mudah namun impact besar — interaktivitas komunitas)_

---

### 19. Admin: Contact Messages Inbox

> 📄 **[Lihat detail spec →](docs/features/FEATURE_19_MESSAGES_INBOX.md)**

**Deskripsi:** Halaman di admin dashboard untuk melihat dan mengelola pesan dari contact form (terhubung dengan fitur #11).

**Frontend:**

- Tabel pesan dengan: nama, email, subject, waktu, status (read/unread)
- Detail panel untuk baca pesan penuh
- Bulk actions: delete, mark as read

**Backend:**

- Endpoint `GET /api/admin/messages` (auth required) — paginated list
- Endpoint `PATCH /api/admin/messages/:id` — update status read
- Endpoint `DELETE /api/admin/messages/:id`

**Effort:** FE: 2 hari · BE: 1 hari _(depends on #11)_

---

### 20. OpenAPI / Swagger Dokumentasi

> 📄 **[Lihat detail spec →](docs/features/FEATURE_20_OPENAPI.md)**

**Deskripsi:** Dokumentasi API otomatis yang bisa diakses di `/api/docs`.

**Frontend:**

- Tidak perlu

**Backend:**

- Tambah crate `utoipa` + `utoipa-swagger-ui`
- Anotasi `#[utoipa::path(...)]` ke setiap route handler
- Mount SwaggerUI di `/api/docs`

**Effort:** FE: 0 hari · BE: 3 hari

---

## 🔴 Fitur Besar

> Estimasi implementasi: **2–6 minggu**. Signifikan secara arsitektur.

---

### 21. Real-time Visitor Analytics Dashboard

**Deskripsi:** Dashboard analytics nyata dengan data visitor, page views, referrer, device, country — ditampilkan di admin panel tanpa third-party.

**Frontend:**

- Halaman `/admin/dashboard/analytics`
- Charts dengan Recharts (sudah ada di dependencies): Line chart untuk daily views, Pie chart device/browser, Bar chart top pages
- Date range picker
- Real-time counter via polling atau SSE

**Backend:**

- Middleware baru di Axum untuk track setiap request
- Tabel `analytics_events`:

```sql
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  path VARCHAR(500) NOT NULL,
  referrer VARCHAR(500),
  user_agent TEXT,
  country_code CHAR(2),
  device_type VARCHAR(20),
  session_id VARCHAR(64),
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Partition by month for performance
```

- Endpoint `GET /api/admin/analytics?from=&to=&group_by=day|week|month`
- IP geolocation menggunakan MaxMind GeoLite2 (offline database)
- Exclude bot traffic berdasarkan User-Agent pattern

**Effort:** FE: 5 hari · BE: 8 hari

---

### 22. Spotify "Now Playing" Widget

**Deskripsi:** Widget real-time yang menampilkan lagu yang sedang diputar (atau lagu terakhir) dari Spotify. Fitur ini disebut di ROADMAP lama tapi belum ada di backend saat ini.

**Frontend:**

- Komponen `NowPlaying` di corner halaman utama atau terminal footer
- Animasi "sound waves" jika sedang playing
- Fallback "Not currently playing" jika idle

**Backend:**

- Tambah route group `/api/spotify`
- OAuth2 flow dengan Spotify API (client credentials + refresh token)
- Cache response 30 detik karena Spotify rate limit
- Endpoint `GET /api/spotify/now-playing`
- Store `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` di env

**Effort:** FE: 2 hari · BE: 3 hari

---

### 23. Blog Series / Collections

**Deskripsi:** Kelompokkan artikel blog menjadi "series" (contoh: "Belajar Rust — Part 1, 2, 3"). Reader bisa navigate antar artikel dalam satu series.

**Frontend:**

- Banner "Part of series: X" di atas konten
- Navigator prev/next dalam series
- Halaman series listing `/blog/series/[slug]`

**Backend:**

```sql
CREATE TABLE blog_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE blog_posts ADD COLUMN series_id UUID REFERENCES blog_series(id);
ALTER TABLE blog_posts ADD COLUMN series_order INTEGER;
```

- Endpoint `GET /api/blog/series` — list series
- Endpoint `GET /api/blog/series/:slug` — posts dalam series (ordered)

**Effort:** FE: 3 hari · BE: 3 hari

---

### 24. Portfolio Content Versioning & Audit History

**Deskripsi:** Setiap perubahan pada portfolio sections (skills, projects, dsb) disimpan sebagai versi, bisa di-rollback.

**Frontend:**

- Panel "Version History" di admin untuk setiap section
- Diff viewer untuk perbandingan antar versi
- Tombol "Restore" untuk rollback

**Backend:**

```sql
CREATE TABLE portfolio_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key VARCHAR(50) NOT NULL,
  content JSONB NOT NULL,
  changed_by VARCHAR(255),
  change_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- Setiap PATCH `/api/portfolio` auto-create version entry
- Endpoint `GET /api/portfolio/:section/versions`
- Endpoint `POST /api/portfolio/:section/restore/:version_id`

**Effort:** FE: 4 hari · BE: 4 hari

---

### 25. Multi-Language Blog Posts (i18n Content)

**Deskripsi:** Artikel blog bisa ditulis dalam beberapa bahasa (ID/EN). Frontend sudah punya i18n hooks, ini extend ke content.

**Frontend:**

- Language switcher di halaman blog (sudah ada pattern dari `use-i18n.ts`)
- Fallback ke EN jika terjemahan tidak tersedia
- Indikator bahasa mana yang tersedia

**Backend:**

```sql
ALTER TABLE blog_posts ADD COLUMN locale VARCHAR(5) NOT NULL DEFAULT 'en';
-- Atau alternatif: tabel terpisah untuk translations
CREATE TABLE blog_post_translations (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  content_md TEXT,
  content_html TEXT,
  PRIMARY KEY (post_id, locale)
);
```

- Update list/get endpoints untuk support `?lang=id|en`

**Effort:** FE: 3 hari · BE: 3 hari

---

### 26. GitHub Contribution Graph & Stats Integration

**Deskripsi:** Tampilkan GitHub contribution graph, pinned repos dengan stats live, dan activity feed — jauh lebih kaya dari yang ada sekarang.

**Frontend:**

- Komponen `GitHubStats` dengan contribution calendar (SVG-based)
- Pinned repos cards dengan star/fork/language badges
- "Streak" counter hari berturut-turut berkontribusi

**Backend:**

- Proxy endpoint `GET /api/github/stats?username=X` untuk menghindari CORS + cache
- Cache 1 jam agar tidak kena rate limit GitHub API
- Support GitHub PAT via `GITHUB_TOKEN` env

**Effort:** FE: 4 hari · BE: 2 hari

---

## 🚀 Fitur Game Changer

> Estimasi implementasi: **1–3 bulan**. Mengubah fundamental cara portfolio ini bekerja.

---

### 27. AI Portfolio Assistant (Chat dengan LLM)

**Deskripsi:** Chatbot AI yang bisa menjawab pertanyaan tentang developer ini — proyek, pengalaman, skill, ketersediaan. Recruiter atau client bisa "interview" AI versi kamu. **Fitur paling diferensiatif di antara semua portfolio developer.**

**User Experience:**

```
User: "Apa pengalaman kamu dengan Rust?"
AI:   "Saya telah menggunakan Rust selama 2 tahun, terutama untuk backend API
       dengan Axum framework. Salah satu proyek terbesar adalah portfolio ini
       sendiri yang dibangun dengan Axum + PostgreSQL..."
```

**Frontend:**

- Command `chat` di terminal untuk membuka AI chat mode
- Atau halaman `/chat` dengan interface chat klasik
- Streaming response dengan SSE (text-by-text)
- Context-aware: tahu tentang skills, projects, blog posts

**Backend:**

- Integrasikan OpenAI API atau Anthropic Claude
- Build "knowledge base" dari portfolio data (RAG — Retrieval Augmented Generation):
  - Portfolio sections sebagai context
  - Blog posts sebagai knowledge
  - GitHub repos sebagai evidence
- Endpoint `POST /api/ai/chat` dengan streaming support
- Rate limit ketat: 10 req/jam per IP, 5 pesan per conversation
- Fallback response jika AI down

**Arsitektur RAG Sederhana:**

```
User Query
    ↓
Embedding Generation (ada-002)
    ↓
Vector Similarity Search (pgvector atau in-memory)
    ↓
Context Assembly (top-k relevant chunks)
    ↓
LLM Completion (GPT-4o / Claude Sonnet)
    ↓
Streaming Response
```

**Backend Dependencies baru:**

```toml
reqwest = { version = "0.12", features = ["json", "stream"] }
tiktoken-rs = "0.5"
pgvector = "0.4"  # jika pakai pgvector extension
```

**Effort:** FE: 5 hari · BE: 14 hari  
**Impact:** Sangat tinggi — portfolio yang bisa "ngobrol" akan diingat selamanya

---

### 28. Live Coding / Demo Environment

**Deskripsi:** Playground interaktif di dalam portfolio di mana visitor bisa langsung mencoba kode. Mirip CodeSandbox tapi embedded, menampilkan skill secara demonstratif.

**User Experience:**

```
Command: playground rust
→ Membuka in-browser Rust playground
→ Visitor bisa edit, run, dan lihat output langsung
```

**Frontend:**

- Embed `@monaco-editor/react` sebagai code editor
- Kirim kode ke backend untuk di-execute
- Tampilkan stdout/stderr dengan syntax highlight
- "Example snippets" yang showcasing skill

**Backend:**

- Gunakan Docker container sebagai sandboxed executor
- Endpoint `POST /api/playground/run` — terima kode + bahasa, return output
- Timeout 10 detik, memory limit 128MB per execution
- Support languages: Rust, JavaScript/TypeScript, Python (via Docker images)
- Queue execution dengan `tokio::sync::mpsc`

**Security:** Semua execution di sandbox container, tidak ada network access, read-only filesystem.

**Effort:** FE: 7 hari · BE: 14 hari  
**Impact:** Sangat tinggi — "show don't tell" yang literal

---

### 29. Newsletter & Email Subscription System

**Deskripsi:** Sistem newsletter lengkap — visitor subscribe, dapat email saat blog post baru, admin bisa kirim broadcast.

**User Experience:**

- Subscribe form dengan double opt-in (konfirmasi via email)
- Unsubscribe link di setiap email
- Admin bisa lihat subscribers dan kirim blast

**Frontend:**

- Komponen `NewsletterForm` di halaman blog
- Command `subscribe` di terminal
- Halaman `/admin/newsletter` untuk compose & send

**Backend:**

```sql
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmation_token VARCHAR(64) UNIQUE,
  unsubscribe_token VARCHAR(64) UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

CREATE TABLE newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(500) NOT NULL,
  content_html TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- Auto-send digest saat blog post baru dipublish (via tokio background task)
- Endpoint `POST /api/newsletter/subscribe`
- Endpoint `GET /api/newsletter/confirm/:token`
- Endpoint `GET /api/newsletter/unsubscribe/:token`
- Endpoint `POST /api/admin/newsletter/send` (broadcast)

**Effort:** FE: 5 hari · BE: 10 hari

---

### 30. Real-Time Collaboration Viewer (Visitor Presence)

**Deskripsi:** Tampilkan secara real-time berapa banyak orang sedang online di portfolio, di halaman mana, lengkap dengan indikator "live". Menggunakan WebSocket.

**User Experience:**

- Terminal menampilkan: `[live] 3 people are viewing this portfolio right now`
- Atau badge live di pojok berisi `● 5 online`
- Admin bisa lihat heatmap real-time di dashboard

**Frontend:**

- WebSocket client dengan reconnect logic
- `usePresence()` hook
- Animasi subtle dot indicator

**Backend:**

- WebSocket server dengan `axum::extract::WebSocketUpgrade`
- In-memory presence store per path: `Arc<RwLock<HashMap<String, HashSet<SessionId>>>>`
- Broadcast count update ke semua connected clients
- Cleanup pada disconnect

**Effort:** FE: 4 hari · BE: 5 hari  
**Impact:** Tinggi — memberikan sense of community dan validasi sosial

---

### 31. Command Terminal sebagai Full CLI Experience

**Deskripsi:** Transformasi terminal menjadi lebih dari sekedar interface — jadikan benar-benar seperti shell dengan piping, chaining commands, scripting sederhana, dan plugin system.

**Fitur Baru:**

```bash
# Piping
projects | grep rust | sort --by-stars

# Command chaining
skills && experience && contact

# Script/alias persisten
alias mystack="skills | grep -v entry"

# Interaktif prompt
new-contact
  > Name: John
  > Email: john@email.com
  > ✓ Message sent!

# Plugin commands dari remote
load-plugin github.com/user/terminal-plugin
```

**Frontend:**

- Extend `command-parser.ts` untuk mendukung pipe operator `|`
- Shell-like grammar dengan lexer sederhana
- Plugin registry: load command JSON dari URL
- Command autocomplete berbasis fuzzy matching (extend `use-command-suggestions.ts`)
- Vi-mode keybindings (optional)

**Backend:**

- Endpoint `GET /api/terminal/plugins` — registry plugin commands
- Endpoint `POST /api/terminal/session` — server-side session state (optional)

**Effort:** FE: 14 hari · BE: 3 hari  
**Impact:** Sangat tinggi — portfolio yang memang "hidup" sebagai terminal

---

### 32. Headless Portfolio CMS Mode

**Deskripsi:** Jadikan backend sebagai CMS yang bisa di-consume oleh frontend lain (mobile app, widget, dsb). Expose portfolio data sebagai public API dengan GraphQL atau REST standar yang lebih kaya.

**User Experience (Developer):**

- Dokumentasi API publik
- API key untuk third-party consumer
- Webhook untuk event: new post, portfolio update

**Backend:**

- Public read-only endpoints: `GET /api/v1/public/...` tanpa auth
- Webhook system: subscribe URL mendapat POST saat ada perubahan
- API key management untuk external consumer
- Rate limit terpisah untuk public vs authenticated
- GraphQL layer menggunakan `async-graphql` crate (optional, replace REST)

**Database additions:**

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(64) UNIQUE NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret VARCHAR(64) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Effort:** FE: 3 hari (docs UI) · BE: 14 hari  
**Impact:** Tinggi — membuka ekosistem dan fleksibilitas maksimal

---

## 📊 Prioritas & Timeline

### Matriks Impact vs Effort

```
HIGH IMPACT
    │
    │  #18 Giscus         #27 AI Chat ▓▓▓
    │  (easy win!)         #31 Full CLI ▓▓▓
    │                      #28 Playground ▓▓▓
    │
    │  #9 RSS Feed        #11 Contact Form
    │  #4 View Counter    #22 Spotify
    │  #13 Search         #21 Analytics ▓▓
    │  #12 Tags           #23 Series
    │
    │  #1 Read Time       #30 Presence
    │  #2 Copy Code       #29 Newsletter ▓
    │  #6 Shortcuts
LOW IMPACT
    └────────────────────────────────────────
       LOW EFFORT                    HIGH EFFORT
```

---

### Rekomendasi Sprint Plan

#### Sprint 1 — "Polish & Discovery" (Minggu 1-2)

Fokus: Quick wins yang langsung terasa oleh pengunjung.

| #   | Fitur                   | Target   |
| --- | ----------------------- | -------- |
| 1   | Reading time estimator  | Hari 1   |
| 2   | Copy code button        | Hari 1   |
| 8   | Table of Contents blog  | Hari 2   |
| 9   | RSS Feed                | Hari 2-3 |
| 18  | Giscus comments         | Hari 3   |
| 4   | Blog view counter       | Hari 4-5 |
| 7   | Command history persist | Hari 5   |
| 6   | Keyboard shortcut modal | Hari 6   |
| 3   | Social share buttons    | Hari 7   |
| 10  | Back to top             | Hari 7   |
| 5   | Scroll progress bar     | Hari 7   |

#### Sprint 2 — "Content & Discovery" (Minggu 3-5)

Fokus: Fitur yang memperkaya konten dan discoverability.

| #   | Fitur                  | Target     |
| --- | ---------------------- | ---------- |
| 12  | Blog tags & kategori   | Minggu 3   |
| 13  | Full-text search       | Minggu 3-4 |
| 11  | Contact form + email   | Minggu 4   |
| 14  | Rich text editor admin | Minggu 4-5 |
| 20  | OpenAPI docs           | Minggu 5   |

#### Sprint 3 — "Power Features" (Bulan 2)

Fokus: Fitur yang membedakan dengan portfolio lain.

| #   | Fitur                    | Target     |
| --- | ------------------------ | ---------- |
| 22  | Spotify Now Playing      | Minggu 1-2 |
| 26  | GitHub stats integration | Minggu 2-3 |
| 15  | Blog scheduling          | Minggu 3   |
| 16  | 2FA admin                | Minggu 3-4 |
| 17  | Image upload             | Minggu 4   |
| 21  | Analytics dashboard      | Minggu 4+  |

#### Sprint 4 — "Game Changers" (Bulan 3+)

Fokus: Fitur yang benar-benar membuat portofolio ini unik.

| #   | Fitur                  | Target    |
| --- | ---------------------- | --------- |
| 27  | AI Portfolio Assistant | Bulan 3   |
| 31  | Full CLI experience    | Bulan 3-4 |
| 30  | Real-time presence     | Bulan 4   |
| 29  | Newsletter system      | Bulan 4-5 |
| 28  | Live playground        | Bulan 5-6 |

---

## 🔧 Catatan Teknis

### Backend (Rust/Axum)

**Dependencies baru yang akan dibutuhkan:**

```toml
# Email
lettre = { version = "0.11", features = ["tokio1-native-tls"] }

# Spotify + external API calls
reqwest = { version = "0.12", features = ["json", "stream"] }

# OpenAPI docs
utoipa = { version = "4", features = ["axum_extras"] }
utoipa-swagger-ui = { version = "7", features = ["axum"] }

# TOTP (2FA)
totp-rs = "5"

# GraphQL (opsional untuk #32)
async-graphql = "7"
async-graphql-axum = "7"

# AI / streaming
eventsource-stream = "0.2"  # untuk SSE parsing

# Multipart upload
axum-multipart = "0.1"
```

**Migration pattern:**

- Setiap fitur baru yang membutuhkan skema DB harus dibuatkan file migration SQL di `migrations/` folder
- Gunakan `sqlx migrate run` sebagai bagian dari startup

**Rekomendasi Database Indexes:**

```sql
-- Untuk search
CREATE INDEX blog_posts_title_idx ON blog_posts USING GIN(to_tsvector('english', title));
CREATE INDEX blog_posts_published_idx ON blog_posts (published, created_at DESC);

-- Untuk analytics
CREATE INDEX analytics_events_path_date_idx ON analytics_events (path, created_at);
CREATE INDEX analytics_events_created_at_idx ON analytics_events (created_at DESC);
```

### Frontend (Next.js/React)

**Pattern yang harus diikuti:**

- Semua server-side data fetching via `lib/services/` atau API Route Handlers di `app/api/`
- Client-side state dengan TanStack Query (sudah ada)
- Form validation dengan Zod + react-hook-form (sudah ada)
- Toast notifications via Sonner (sudah ada)
- Komponen baru mengikuti Atomic Design yang sudah ada: `atoms/` → `molecules/` → `organisms/`

**Environment variables baru:**
3 |
| 16| 2FA admin | Minggu 3-4 |
| 17| Image upload | Minggu 4 |
| 21| Analytics dashboard | Minggu 4+ |

#### Sprint 4 — "Game Changers" (Bulan 3+)

Fokus: Fitur yang benar-benar membuat portofolio ini unik.

| #   | Fitur                  | Target    |
| --- | ---------------------- | --------- |
| 27  | AI Portfolio Assistant | Bulan 3   |
| 31  | Full CLI experience    | Bulan 3-4 |
| 30  | Real-time presence     | Bulan 4   |
| 29  | Newsletter system      | Bulan 4-5 |
| 28  | Live playground        | Bulan 5-6 |

---

## 🔧 Catatan Teknis

### Backend (Rust/Axum)

**Dependencies baru yang akan dibutuhkan:**

```toml
# Email
lettre = { version = "0.11", features = ["tokio1-native-tls"] }

# Spotify + external API calls
reqwest = { version = "0.12", features = ["json", "stream"] }

# OpenAPI docs
utoipa = { version = "4", features = ["axum_extras"] }
utoipa-swagger-ui = { version = "7", features = ["axum"] }

# TOTP (2FA)
totp-rs = "5"

# GraphQL (opsional untuk #32)
async-graphql = "7"
async-graphql-axum = "7"

# AI / streaming
eventsource-stream = "0.2"  # untuk SSE parsing

# Multipart upload
axum-multipart = "0.1"
```

**Migration pattern:**

- Setiap fitur baru yang membutuhkan skema DB harus dibuatkan file migration SQL di `migrations/` folder
- Gunakan `sqlx migrate run` sebagai bagian dari startup

**Rekomendasi Database Indexes:**

```sql
-- Untuk search
CREATE INDEX blog_posts_title_idx ON blog_posts USING GIN(to_tsvector('english', title));
CREATE INDEX blog_posts_published_idx ON blog_posts (published, created_at DESC);

-- Untuk analytics
CREATE INDEX analytics_events_path_date_idx ON analytics_events (path, created_at);
CREATE INDEX analytics_events_created_at_idx ON analytics_events (created_at DESC);
```

### Frontend (Next.js/React)

**Pattern yang harus diikuti:**

- Semua server-side data fetching via `lib/services/` atau API Route Handlers di `app/api/`
- Client-side state dengan TanStack Query (sudah ada)
- Form validation dengan Zod + react-hook-form (sudah ada)
- Toast notifications via Sonner (sudah ada)
- Komponen baru mengikuti Atomic Design yang sudah ada: `atoms/` → `molecules/` → `organisms/`

**Environment variables baru:**

```env
# Contact/Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=app-password
CONTACT_EMAIL=your@email.com

# Spotify
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
SPOTIFY_REFRESH_TOKEN=xxx

# OpenAI (fitur AI)
OPENAI_API_KEY=sk-xxx

# Newsletter
NEWSLETTER_FROM_EMAIL=newsletter@yourdomain.com
```

### DevOps / Infrastructure

- Pertimbangkan **Redis** untuk caching (disebutkan di ROADMAP lama tapi tidak ada di Cargo.toml saat ini)
- **CDN** untuk assets statis (gambar blog, resume PDF)
- **pgvector** PostgreSQL extension jika implement AI embeddings
- Docker Compose update untuk include services baru (Redis, MinIO untuk storage)

---

## 📌 Kesimpulan

Portfolio ini sudah memiliki **fondasi teknis yang sangat solid** — Rust backend yang cepat dan aman, terminal interface yang unik, infrastruktur logging yang mature, dan arsitektur frontend yang bersih.

**Fokus utama yang direkomendasikan:**

1. **Jangka pendek (1-2 minggu):** Sprint 1 Quick Wins — akan langsung terasa perbedaannya bagi pengunjung
2. **Jangka menengah (1 bulan):** Contact form, blog tags, search — melengkapi kebutuhan dasar portfolio profesional
3. **Jangka panjang (3+ bulan):** AI Assistant — ini adalah **satu fitur yang akan membuat portfolio ini benar-benar tak terlupakan**

> "Your portfolio should be the best demo of your skills. A portfolio with an AI that knows everything about you is not just impressive — it's your 24/7 recruiter."
