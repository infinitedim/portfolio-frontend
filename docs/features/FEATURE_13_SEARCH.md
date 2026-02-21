# Feature #13 — Full-Text Search untuk Blog & Projects

> **Prioritas:** 🔴 Tinggi  
> **Estimasi:** FE 2 hari · BE 2 hari  
> **Dependencies:** #12 Blog Tags (tag filter dipakai di search results)  
> **Dependants:** Tidak ada

---

## 📋 Deskripsi

Search bar global dengan shortcut `Ctrl+K` (Command Palette style) yang bisa mencari blog posts dan projects sekaligus. Menggunakan `cmdk` library yang sudah terinstall di project.

### State Saat Ini

- `cmdk` (v1.1.1) sudah ada di `package.json` dependencies
- `use-debounced-value.ts` sudah ada di hooks
- Backend `BlogListQuery` sudah support `?search=` param
- Belum ada endpoint search terpusat yang menggabungkan blog + projects
- Belum ada komponen search modal di frontend
- Belum ada full-text search index (tsvector) di PostgreSQL

### Approach: 2 Phase

1. **Phase 1 (MVP):** Gunakan `ILIKE` pattern matching yang sudah ada + frontend `cmdk` modal
2. **Phase 2 (Optimization):** Migrasi ke PostgreSQL `tsvector` + `ts_rank` untuk ranking yang lebih baik

---

## ✅ Subtask Checklist

### Backend (`portfolio-backend`)

- [ ] **B-13.1** SQL migration: tambah kolom dan index full-text search

  ```sql
  ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

  CREATE INDEX IF NOT EXISTS idx_blog_posts_fts
    ON blog_posts USING GIN(search_vector);

  -- Trigger auto-update search_vector
  CREATE OR REPLACE FUNCTION blog_posts_search_vector_update() RETURNS trigger AS $$
  BEGIN
    NEW.search_vector :=
      setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(NEW.content_md, '')), 'C') ||
      setweight(to_tsvector('english', array_to_string(COALESCE(NEW.tags, '{}'), ' ')), 'B');
    RETURN NEW;
  END
  $$ LANGUAGE plpgsql;

  CREATE OR REPLACE TRIGGER blog_posts_search_vector_trigger
    BEFORE INSERT OR UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION blog_posts_search_vector_update();

  -- Backfill existing posts
  UPDATE blog_posts SET search_vector =
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(content_md, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(tags, '{}'), ' ')), 'B');
  ```

- [ ] **B-13.2** Update struct `BlogPost` di `src/db/models.rs`: tambah `#[sqlx(skip)]` field `search_rank: Option<f32>` (opsional, untuk sorting by relevance)

- [ ] **B-13.3** Buat file baru `src/routes/search.rs` dengan handler `search`
  - Query params: `q` (required), `type` (blog|project|all, default: all), `limit` (default: 10, max: 50)
  - Blog search: gunakan `search_vector @@ plainto_tsquery('english', $1)` dengan `ts_rank` untuk scoring
  - Project search: gunakan `ILIKE` pada `content->>'title'` dan `content->>'description'` dari `portfolio_sections` WHERE key = 'projects'
  - Fallback: jika `search_vector` kosong/belum populated, fallback ke `ILIKE '%query%'` pada title + summary

- [ ] **B-13.4** Register route di `src/routes/mod.rs` dan `src/lib.rs`:

  ```rust
  .route("/api/search", get(routes::search::search))
  ```

- [ ] **B-13.5** Rate limit: 30 requests/menit per IP untuk search endpoint

### Frontend (`portfolio-frontend`)

- [ ] **F-13.1** Buat hook `src/hooks/use-search.ts`

  ```typescript
  interface SearchResult {
    blog: BlogSearchItem[];
    projects: ProjectSearchItem[];
  }
  function useSearch(query: string): {
    data: SearchResult | null;
    isLoading: boolean;
    error: string | null;
  };
  ```

  - Gunakan `useDebouncedValue` (300ms) untuk debounce input
  - Fetch ke `GET /api/search?q={query}&type=all&limit=10`
  - Skip fetch jika query < 2 karakter

- [ ] **F-13.2** Buat komponen `SearchModal` di `src/components/molecules/shared/search-modal.tsx`
  - Gunakan `cmdk`: `Command.Dialog`, `Command.Input`, `Command.List`, `Command.Group`, `Command.Item`, `Command.Empty`
  - Grup: "Blog Posts" dan "Projects"
  - Loading state: `Command.Loading`
  - Empty state: "Tidak ada hasil untuk '{query}'"
  - Setiap blog result: title, summary snippet (max 80 chars), tags (TagChip dari #12)
  - Setiap project result: title, description snippet, technologies
  - Klik blog → `router.push('/blog/{slug}')`
  - Klik project → `router.push('/projects')`
  - Close on `Escape`, close on item select, close on outside click

- [ ] **F-13.3** Buat komponen `SearchTrigger` di `src/components/molecules/shared/search-trigger.tsx`
  - Button dengan icon search + text "Search..." + badge shortcut `⌘K` / `Ctrl+K`
  - Styling: muted background, border, monospace shortcut text
  - Klik button → open SearchModal

- [ ] **F-13.4** Register shortcut `Ctrl+K` / `Meta+K` secara global
  - Di `src/app/layout.tsx`: tambah event listener `keydown`, jika `Ctrl+K` / `Meta+K` → open SearchModal
  - `preventDefault` untuk mencegah browser default (browser search bar)
  - Alternatif: state management via React context atau Zustand

- [ ] **F-13.5** Integrasi di layout
  - Render `SearchTrigger` di header/navbar area
  - Render `SearchModal` di layout root (portal-based via `cmdk` Dialog)
  - Pastikan modal muncul di atas terminal UI

- [ ] **F-13.6** Terminal command integration
  - Tambah command `search <query>` yang membuka SearchModal dengan query pre-filled
  - Hasil bisa ditampilkan inline di terminal juga (opsional)

- [ ] **F-13.7** Unit test `useSearch` hook dan `SearchModal`

---

## 📁 File Mapping

| File                                                                    | Aksi          | Deskripsi                                     |
| ----------------------------------------------------------------------- | ------------- | --------------------------------------------- |
| `portfolio-backend/src/db/mod.rs`                                       | Modifikasi    | Tambah migration tsvector + trigger           |
| `portfolio-backend/src/routes/search.rs`                                | **Buat baru** | Handler search endpoint                       |
| `portfolio-backend/src/routes/mod.rs`                                   | Modifikasi    | Export `pub mod search`                       |
| `portfolio-backend/src/lib.rs`                                          | Modifikasi    | Register route `/api/search`                  |
| `portfolio-frontend/src/hooks/use-search.ts`                            | **Buat baru** | Search hook with debounce                     |
| `portfolio-frontend/src/components/molecules/shared/search-modal.tsx`   | **Buat baru** | cmdk-based search dialog                      |
| `portfolio-frontend/src/components/molecules/shared/search-trigger.tsx` | **Buat baru** | Button trigger + shortcut badge               |
| `portfolio-frontend/src/app/layout.tsx`                                 | Modifikasi    | Global keyboard shortcut + render SearchModal |

---

## 🔌 API Contract

### `GET /api/search?q=rust&type=all&limit=10`

```json
{
  "blog": [
    {
      "slug": "building-rest-api-axum",
      "title": "Building a REST API with Axum",
      "summary": "Learn how to build a performant REST API...",
      "tags": ["Rust", "Axum"],
      "readingTimeMinutes": 8,
      "rank": 0.75,
      "createdAt": "2026-02-20T10:00:00Z"
    }
  ],
  "projects": [
    {
      "title": "WebAssembly Compiler",
      "description": "A compiler written in Rust targeting WASM...",
      "technologies": ["Rust", "WebAssembly"],
      "url": "https://github.com/..."
    }
  ],
  "meta": {
    "query": "rust",
    "totalBlog": 3,
    "totalProjects": 1,
    "took_ms": 12
  }
}
```

### Error Responses

```json
// Missing query
GET /api/search
→ 400: { "error": "Query parameter 'q' is required" }

// Query too short
GET /api/search?q=a
→ 400: { "error": "Query must be at least 2 characters" }

// Rate limited
→ 429: { "error": "Too many search requests. Try again later." }
```

---

## ✅ Acceptance Criteria

| #     | Kriteria                                                                                           | Cara Verifikasi               |
| ----- | -------------------------------------------------------------------------------------------------- | ----------------------------- |
| AC-1  | `Ctrl+K` / `⌘K` membuka search modal dari halaman mana saja                                        | Manual test keyboard shortcut |
| AC-2  | Mengetik query ≥2 chars → hasil muncul dalam <500ms (debounce 300ms + API)                         | Network tab + stopwatch       |
| AC-3  | Hasil dibagi per kategori: "Blog Posts" dan "Projects"                                             | Visual check                  |
| AC-4  | Klik hasil blog → navigate ke `/blog/{slug}`, modal tertutup                                       | Manual test                   |
| AC-5  | Klik hasil project → navigate ke `/projects`, modal tertutup                                       | Manual test                   |
| AC-6  | `Escape` menutup modal                                                                             | Manual test                   |
| AC-7  | Keyboard navigation (↑↓ Enter) berfungsi untuk pilih hasil                                         | Manual test                   |
| AC-8  | Empty state ditampilkan jika tidak ada hasil                                                       | Manual test                   |
| AC-9  | Full-text search: mencari "axum" menemukan post dengan kata "Axum" di title, summary, atau content | curl + search test            |
| AC-10 | Search results diranking: match di title lebih tinggi dari match di content                        | Verify ranking order          |

---

## 🎨 Design Notes

- Modal: centered overlay, max-width 640px, max-height 400px
- Input: large, autofocus, icon search kiri, clear button kanan
- Results: grouped `<Command.Group heading="Blog Posts">`, setiap item punya icon kiri (📝 blog, 📂 project)
- Keyboard shortcut badge di trigger button: `bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded`
- Animation: scale-in on open, fade-out on close (cmdk Dialog handles this)

---

## 🔧 Technical Notes

### PostgreSQL Full-Text Search Weights

- **A (highest):** `title` — match di judul paling relevan
- **B:** `summary` + `tags` — match di ringkasan dan tags cukup relevan
- **C:** `content_md` — match di konten body relevan tapi rendah

### Fallback Strategy

Jika `search_vector` kosong (post lama belum di-backfill):

```sql
WHERE (search_vector @@ plainto_tsquery('english', $1))
   OR (title ILIKE '%' || $1 || '%')
   OR (summary ILIKE '%' || $1 || '%')
```

### Performance

- GIN index pada `search_vector` → sub-millisecond query
- Limit default 10, max 50 → prevent heavy queries
- Debounce 300ms di frontend → reduce API calls
