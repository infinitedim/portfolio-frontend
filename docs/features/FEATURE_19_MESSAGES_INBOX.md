# Feature #19 — Admin: Contact Messages Inbox

> **Prioritas:** 🟡 Sedang  
> **Estimasi:** FE 2 hari · BE 1 hari  
> **Dependencies:** #11 Contact Form (tabel `contact_messages` dan endpoint simpan pesan)  
> **Dependants:** Tidak ada

---

## 📋 Deskripsi

Halaman inbox di admin dashboard untuk melihat, membaca, dan mengelola pesan dari contact form (#11). Termasuk fitur mark as read, delete, dan bulk operations.

### State Saat Ini

- Tabel `contact_messages` dibuat di #11 (belum ada saat ini)
- Admin endpoints (list, get, update, delete) dibuat di #11 tapi belum di-integrate ke frontend
- Admin dashboard sudah ada di `src/app/admin/dashboard/page.tsx`
- Admin sudah punya sidebar navigation pattern di `terminal-sidebar.tsx`
- Komponen data table belum ada (perlu buat baru)

---

## ✅ Subtask Checklist

### Backend (`portfolio-backend`)

> Sebagian besar backend sudah disiapkan di #11. Berikut adalah endpoints spesifik yang perlu dipastikan ada:

- [ ] **B-19.1** Endpoint `GET /api/admin/messages` (auth required)
  - Query params: `page`, `limit`, `status` (all|read|unread)
  - Require valid Bearer token
  - Query: `SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT $1 OFFSET $2`
  - Filter status: `WHERE read = false` (unread) atau `WHERE read = true` (read)
  - Return paginated response + total count

- [ ] **B-19.2** Endpoint `GET /api/admin/messages/:id` (auth required)
  - Auto-mark as read: `UPDATE contact_messages SET read = true WHERE id = $1`
  - Return full message detail

- [ ] **B-19.3** Endpoint `PATCH /api/admin/messages/:id` (auth required)

  ```json
  { "read": true } // or false
  ```

- [ ] **B-19.4** Endpoint `DELETE /api/admin/messages/:id` (auth required)
  - Hard delete dari DB
  - Return 204

- [ ] **B-19.5** Endpoint `DELETE /api/admin/messages/bulk` (auth required) — opsional

  ```json
  { "ids": ["uuid1", "uuid2", "uuid3"] }
  ```

  - Delete multiple messages in single query
  - Return `{ "deleted": 3 }`

- [ ] **B-19.6** Endpoint `GET /api/admin/messages/stats` (auth required) — opsional
  - Return: `{ "total": 42, "unread": 5, "today": 2 }`
  - Berguna untuk badge count di sidebar

- [ ] **B-19.7** Register semua routes di `src/lib.rs`
  ```rust
  .route("/api/admin/messages", get(routes::contact::list_messages))
  .route("/api/admin/messages/stats", get(routes::contact::message_stats))
  .route("/api/admin/messages/bulk", delete(routes::contact::bulk_delete_messages))
  .route("/api/admin/messages/{id}",
    get(routes::contact::get_message)
      .patch(routes::contact::update_message)
      .delete(routes::contact::delete_message)
  )
  ```

### Frontend (`portfolio-frontend`)

- [ ] **F-19.1** Buat halaman `src/app/admin/dashboard/messages/page.tsx`
  - Server component wrapper
  - SEO: title "Messages | Admin Dashboard"
  - Render `MessagesInbox` client component

- [ ] **F-19.2** Buat komponen `MessagesInbox` di `src/components/organisms/admin/messages-inbox.tsx`
  - Layout: 2-panel — list kiri, detail kanan (responsive: stack di mobile)
  - Gunakan `react-resizable-panels` (sudah terinstall) untuk resizable split panes
  - State: `selectedMessageId`, `filter` (all|unread|read), `page`
  - Fetch data: `GET /api/admin/messages?page=${page}&limit=20&status=${filter}`

- [ ] **F-19.3** Buat komponen `MessagesTable` di `src/components/molecules/admin/messages-table.tsx`
  - Columns: Checkbox (select), Status (dot), Name, Subject, Date
  - Row styling: unread = bold font-weight, read = normal
  - Click row → select message, show detail in right panel
  - Unread indicator: blue dot
  - Date format: relative ("2 hours ago", "Yesterday") via `date-fns` `formatDistanceToNow`
  - Pagination: "1-20 of 42" + Prev/Next buttons
  - Empty state: "No messages yet. Messages from your contact form will appear here."

- [ ] **F-19.4** Buat komponen `MessageDetail` di `src/components/molecules/admin/message-detail.tsx`
  - Header: Name, Email (ClickableLink → `mailto:`), Date, Subject
  - Body: full message text, preserving whitespace (`whitespace-pre-wrap`)
  - Actions:
    - "Reply" → open `mailto:{email}?subject=Re: {subject}`
    - "Mark as Unread" / "Mark as Read" toggle
    - "Delete" → confirmation dialog, then delete

- [ ] **F-19.5** Bulk actions toolbar di atas table
  - Muncul saat ≥1 message di-checkbox
  - Actions: "Delete Selected" (confirmation dialog), "Mark as Read", "Mark as Unread"
  - "Select All" checkbox di header

- [ ] **F-19.6** Filter tabs
  - 3 tabs: "All (42)", "Unread (5)", "Read (37)"
  - Badge counts
  - Click tab → filter messages

- [ ] **F-19.7** Unread badge di admin sidebar
  - Di `terminal-sidebar.tsx`: tambah link "Messages" dengan unread count badge
  - Fetch count dari `GET /api/admin/messages/stats`
  - Badge: red dot atau number badge `(5)` jika ada unread

- [ ] **F-19.8** Auto-mark as read
  - Saat message detail dibuka → auto PATCH `read: true`
  - Update local state immediately (optimistic update)

- [ ] **F-19.9** Real-time unread count (opsional, nice-to-have)
  - Poll `GET /api/admin/messages/stats` setiap 60 detik
  - Update badge count di sidebar

- [ ] **F-19.10** Unit test: `MessagesTable`, `MessageDetail`, filter logic

---

## 📁 File Mapping

| File                                                                     | Aksi          | Deskripsi                                         |
| ------------------------------------------------------------------------ | ------------- | ------------------------------------------------- |
| `portfolio-backend/src/routes/contact.rs`                                | Modifikasi    | Tambah admin message handlers (sebagian dari #11) |
| `portfolio-backend/src/lib.rs`                                           | Modifikasi    | Register admin message routes                     |
| `portfolio-frontend/src/app/admin/dashboard/messages/page.tsx`           | **Buat baru** | Messages page                                     |
| `portfolio-frontend/src/components/organisms/admin/messages-inbox.tsx`   | **Buat baru** | Main inbox layout                                 |
| `portfolio-frontend/src/components/molecules/admin/messages-table.tsx`   | **Buat baru** | Message list table                                |
| `portfolio-frontend/src/components/molecules/admin/message-detail.tsx`   | **Buat baru** | Message detail panel                              |
| `portfolio-frontend/src/components/molecules/admin/terminal-sidebar.tsx` | Modifikasi    | Tambah "Messages" link + badge                    |

---

## 🔌 API Contract

### `GET /api/admin/messages?page=1&limit=20&status=all`

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "Job Opportunity",
      "message": "Hi, I saw your portfolio...",
      "ipAddress": "203.0.113.45",
      "read": false,
      "createdAt": "2026-02-21T10:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### `GET /api/admin/messages/:id`

```json
{
  "id": "550e8400...",
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Job Opportunity",
  "message": "Hi, I saw your portfolio and would like to discuss a potential collaboration...",
  "ipAddress": "203.0.113.45",
  "read": true,
  "createdAt": "2026-02-21T10:30:00Z"
}
```

### `PATCH /api/admin/messages/:id`

```
Request:  { "read": false }
Response: { "id": "...", "read": false }
```

### `DELETE /api/admin/messages/:id`

```
Response: 204 No Content
```

### `DELETE /api/admin/messages/bulk`

```
Request:  { "ids": ["uuid1", "uuid2"] }
Response: { "deleted": 2 }
```

### `GET /api/admin/messages/stats`

```json
{ "total": 42, "unread": 5, "today": 2 }
```

---

## ✅ Acceptance Criteria

| #     | Kriteria                                                         | Cara Verifikasi          |
| ----- | ---------------------------------------------------------------- | ------------------------ |
| AC-1  | Admin bisa melihat semua pesan masuk dengan pagination           | Visual check             |
| AC-2  | Klik pesan → detail terbuka di panel kanan                       | Manual test              |
| AC-3  | Pesan otomatis ditandai "Read" saat dibuka                       | Check DB/API             |
| AC-4  | Bulk delete: select multiple → delete → pesan hilang             | Manual test              |
| AC-5  | Filter tabs (All/Unread/Read) berfungsi dengan count badge       | Manual test              |
| AC-6  | Badge unread muncul di admin sidebar navigation                  | Visual check             |
| AC-7  | "Reply" button membuka email client dengan pre-filled to/subject | Manual test              |
| AC-8  | Empty state ditampilkan jika tidak ada pesan                     | Remove all messages test |
| AC-9  | Hanya admin (authenticated) yang bisa akses endpoints            | 401 test                 |
| AC-10 | Resizable panels bekerja di desktop (drag divider)               | Manual test              |

---

## 🎨 Design Notes

### Layout

```
┌─────────────────────────────────────────┐
│ Messages (42)  [All] [Unread (5)] [Read]│
├──────────────────────┬──────────────────┤
│ ☐ 🔵 John Doe       │ From: John Doe   │
│   Job Opportunity    │ john@example.com │
│   2 hours ago        │ Feb 21, 10:30    │
│──────────────────────│                  │
│ ☐    Jane Smith      │ Subject:         │
│   Collaboration      │ Job Opportunity  │
│   Yesterday          │                  │
│──────────────────────│ Hi, I saw your   │
│ ☐    Bob Wilson      │ portfolio and    │
│   Bug Report         │ would like to... │
│   3 days ago         │                  │
│                      │ [Reply] [Delete] │
└──────────────────────┴──────────────────┘
```

### Mobile

- Stack: list → detail view (navigate, bukan split)
- Back button di detail view untuk kembali ke list
- Swipe-to-delete (opsional, nice-to-have)
