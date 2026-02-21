# Feature #15 — Blog Post Scheduling

> **Prioritas:** 🟡 Sedang  
> **Estimasi:** FE 1 hari · BE 2 hari  
> **Dependencies:** Tidak ada  
> **Dependants:** Tidak ada

---

## 📋 Deskripsi

Admin bisa menjadwalkan artikel untuk publish otomatis di waktu tertentu. Artikel dengan `publish_at` di masa depan akan berstatus "Scheduled" dan otomatis berubah menjadi published saat waktunya tiba.

### State Saat Ini

- `blog_posts` tabel punya kolom `published: BOOLEAN`
- `BlogPost` struct punya field `published: bool`
- `BlogListQuery` support `?published=true|false` filter
- Blog list query: `WHERE published = true`
- Tidak ada kolom `publish_at`
- Tidak ada background task/scheduler di backend
- `react-day-picker` (v9.13.0) dan `date-fns` (v4.1.0) sudah terinstall di frontend
- `@radix-ui/react-popover` sudah terinstall (untuk date picker popover)

---

## ✅ Subtask Checklist

### Backend (`portfolio-backend`)

- [ ] **B-15.1** SQL migration: tambah kolom `publish_at`

  ```sql
  ALTER TABLE blog_posts
    ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ;

  CREATE INDEX IF NOT EXISTS idx_blog_posts_publish_at
    ON blog_posts(publish_at)
    WHERE publish_at IS NOT NULL AND published = false;
  ```

- [ ] **B-15.2** Update `BlogPost` struct di `src/db/models.rs`

  ```rust
  pub publish_at: Option<DateTime<Utc>>,
  ```

- [ ] **B-15.3** Update request structs di `src/db/models.rs`

  ```rust
  // NewBlogPost
  pub publish_at: Option<DateTime<Utc>>,

  // UpdateBlogPost
  pub publish_at: Option<Option<DateTime<Utc>>>,  // None = don't change, Some(None) = clear, Some(Some(dt)) = set
  ```

- [ ] **B-15.4** Update query `list_posts` di `src/routes/blog.rs`
  - Public query (`published=true`): include posts where `publish_at <= NOW()` even if `published` still false

  ```sql
  WHERE (published = true)
     OR (publish_at IS NOT NULL AND publish_at <= NOW())
  ```

  - Admin query (no `published` filter): show all, termasuk scheduled

- [ ] **B-15.5** Update response: tambah computed field `status`

  ```rust
  #[derive(Serialize)]
  #[serde(rename_all = "camelCase")]
  pub struct BlogPostResponse {
      // ... existing fields ...
      pub publish_at: Option<DateTime<Utc>>,
      pub status: String, // "published" | "draft" | "scheduled"
  }

  fn compute_status(published: bool, publish_at: Option<DateTime<Utc>>) -> String {
      if published { "published".into() }
      else if let Some(at) = publish_at {
          if at > Utc::now() { "scheduled".into() }
          else { "published".into() }
      } else { "draft".into() }
  }
  ```

- [ ] **B-15.6** Update `create_post` dan `update_post` handler
  - Accept `publish_at` field
  - Validasi: `publish_at` harus di masa depan jika diset (reject past dates)
  - Jika `publish_at` diset dan `published = true` → ignore `publish_at` (sudah published)

- [ ] **B-15.7** Implementasi background scheduler task

  ```rust
  // Di src/lib.rs, di dalam run():
  tokio::spawn(async {
      let mut interval = tokio::time::interval(
          std::time::Duration::from_secs(60) // check setiap 1 menit
      );
      loop {
          interval.tick().await;
          if let Some(pool) = db::get_pool() {
              match sqlx::query(
                  "UPDATE blog_posts SET published = true, updated_at = NOW()
                   WHERE published = false
                   AND publish_at IS NOT NULL
                   AND publish_at <= NOW()"
              ).execute(pool.as_ref()).await {
                  Ok(result) => {
                      if result.rows_affected() > 0 {
                          tracing::info!(
                              "Auto-published {} scheduled blog post(s)",
                              result.rows_affected()
                          );
                      }
                  }
                  Err(e) => {
                      tracing::error!("Scheduler: failed to publish posts: {}", e);
                  }
              }
          }
      }
  });
  ```

- [ ] **B-15.8** Logging: log setiap auto-publish event (post title, scheduled time, actual publish time)

### Frontend (`portfolio-frontend`)

- [ ] **F-15.1** Buat komponen `DateTimePicker` di `src/components/molecules/admin/date-time-picker.tsx`
  - Gunakan `@radix-ui/react-popover` + `react-day-picker` + `<input type="time">`
  - Props: `value: Date | null`, `onChange: (date: Date | null) => void`, `minDate?: Date`
  - Calendar popover: select date
  - Time input: HH:MM (24h format)
  - Clear button: set null (remove schedule)
  - Display: format human-readable "25 Feb 2026, 10:00 WIB"
  - Validasi: tidak boleh di masa lalu

- [ ] **F-15.2** Update `src/components/molecules/admin/blog-editor.tsx`
  - Tambah `DateTimePicker` di area publishing controls (sebelah toggle "Published")
  - Logic:
    - Jika `published = true`: DateTimePicker disabled (sudah published)
    - Jika `published = false` dan `publish_at` diset: tampilkan status "Scheduled"
    - Jika `published = false` dan `publish_at` null: status "Draft"
  - Save flow: kirim `publishAt` ke API saat create/update

- [ ] **F-15.3** Status badge komponen
  - Buat `PostStatusBadge` di `src/components/atoms/shared/post-status-badge.tsx`
  - Variants:
    - `published`: green badge "Published"
    - `draft`: gray badge "Draft"
    - `scheduled`: yellow/amber badge "Scheduled — Feb 25, 10:00"
  - Tampilkan di admin blog list dan editor

- [ ] **F-15.4** Update admin blog list
  - Tampilkan kolom Status dengan badge berwarna
  - Sort: Scheduled posts di-highlight (bisa di atas?)
  - Tooltip pada scheduled: "Will be published on Feb 25, 2026 at 10:00 WIB"

- [ ] **F-15.5** Unit test `DateTimePicker`, `PostStatusBadge`

---

## 📁 File Mapping

| File                                                                     | Aksi          | Deskripsi                           |
| ------------------------------------------------------------------------ | ------------- | ----------------------------------- |
| `portfolio-backend/src/db/mod.rs`                                        | Modifikasi    | Migration tambah `publish_at`       |
| `portfolio-backend/src/db/models.rs`                                     | Modifikasi    | Tambah `publish_at` field           |
| `portfolio-backend/src/routes/blog.rs`                                   | Modifikasi    | Update queries + status computation |
| `portfolio-backend/src/lib.rs`                                           | Modifikasi    | Tambah background scheduler task    |
| `portfolio-frontend/src/components/molecules/admin/date-time-picker.tsx` | **Buat baru** | Calendar + time picker              |
| `portfolio-frontend/src/components/atoms/shared/post-status-badge.tsx`   | **Buat baru** | Status badge component              |
| `portfolio-frontend/src/components/molecules/admin/blog-editor.tsx`      | Modifikasi    | Integrasi DateTimePicker            |

---

## 🔌 API Contract

### `POST /api/blog` (updated request body)

```json
{
  "title": "My Upcoming Post",
  "slug": "my-upcoming-post",
  "contentMd": "...",
  "contentHtml": "...",
  "published": false,
  "publishAt": "2026-02-25T03:00:00Z",
  "tags": ["Rust"]
}
```

### `GET /api/blog` (updated response — admin view)

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "My Upcoming Post",
      "slug": "my-upcoming-post",
      "published": false,
      "publishAt": "2026-02-25T03:00:00Z",
      "status": "scheduled",
      "tags": ["Rust"],
      "readingTimeMinutes": 5,
      "createdAt": "2026-02-21T10:00:00Z",
      "updatedAt": "2026-02-21T10:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 5
}
```

### `GET /api/blog` (public view — published=true)

Posts with `publish_at <= NOW()` are included automatically.  
Posts with `publish_at > NOW()` are **NOT** included.

---

## ✅ Acceptance Criteria

| #    | Kriteria                                                                    | Cara Verifikasi          |
| ---- | --------------------------------------------------------------------------- | ------------------------ |
| AC-1 | Scheduled post tidak muncul di blog publik sebelum waktunya                 | Check public blog list   |
| AC-2 | Scheduled post otomatis muncul setelah `publish_at` tercapai (within 1 min) | Wait for scheduled time  |
| AC-3 | Status "Scheduled" tampil di admin blog list dengan waktu publish           | Visual check admin       |
| AC-4 | `publish_at` di masa lalu ditolak oleh API                                  | curl test with past date |
| AC-5 | Post yang sudah published: DateTimePicker disabled                          | UI test                  |
| AC-6 | Background task graceful: tidak crash jika DB down                          | Kill DB + check logs     |
| AC-7 | Log: "Auto-published 2 scheduled blog post(s)" muncul di log                | Log check                |
| AC-8 | Clear schedule (set null): post kembali ke status "Draft"                   | UI + API test            |

---

## 🔧 Technical Notes

### Scheduler Reliability

- Interval 60 detik sudah cukup akurat (max 1 menit delay publish)
- Idempotent: `WHERE published = false` mencegah double-publish
- Graceful: log error tapi jangan panic, retry di interval berikutnya
- Consideration: jika server restart, scheduled posts yang sudah lewat akan ter-publish di tick pertama

### Timezone Handling

- Semua waktu disimpan dan ditransfer sebagai UTC (`TIMESTAMPTZ` di PostgreSQL, `DateTime<Utc>` di Rust)
- Frontend bertanggung jawab untuk convert ke timezone lokal user (tampilan) dan convert balik ke UTC (kirim ke API)
- Gunakan `date-fns` `formatInTimeZone` atau `Intl.DateTimeFormat` untuk display

### DateTimePicker UX Guidelines

- Min date: today (tidak bisa schedule ke masa lalu)
- Default time: 09:00 (saat user pilih tanggal, auto-set jam 09:00)
- Clear button visible: "Remove schedule" untuk hapus jadwal
- Feedback text: "Will be published on Feb 25, 2026 at 10:00 WIB (in 4 days)"
