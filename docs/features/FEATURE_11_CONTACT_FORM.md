<!-- # Feature #11 — Contact / Message Form dengan Email

> **Prioritas:** 🟡 Sedang
> **Estimasi:** FE 1 hari · BE 2 hari
> **Dependencies:** Tidak ada
> **Dependants:** #19 Messages Inbox (admin panel untuk baca pesan)

---

## 📋 Deskripsi

Form kontak yang mengirim pesan ke inbox developer via email SMTP. Pesan juga tersimpan di database sebagai arsip yang bisa dilihat via admin dashboard (#19). Rate limited per IP.

### State Saat Ini

- Tidak ada halaman contact atau form kontak
- `react-hook-form` (v7.69.0) dan `zod` (v4.2.1) sudah terinstall
- `@hookform/resolvers` (v5.2.2) sudah terinstall
- `sonner` (v2.0.7) sudah terinstall untuk toast notifications
- Backend belum ada crate email/SMTP
- Rate limiting pattern sudah ada di `auth.rs` (in-memory HashMap) yang bisa direuse

### SMTP Configuration

- Gunakan `lettre` crate (paling mature Rust email library)
- Support Gmail App Password, SendGrid, Mailgun, custom SMTP
- Async sending via `tokio` transport

---

## ✅ Subtask Checklist

### Backend (`portfolio-backend`)

- [ ] **B-11.1** Tambah dependency di `Cargo.toml`

  ```toml
  lettre = { version = "0.11", features = ["tokio1-native-tls", "builder"] }
  ```

- [ ] **B-11.2** SQL migration: buat tabel `contact_messages`

  ```sql
  CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    ip_address VARCHAR(45),
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
    ON contact_messages(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_contact_messages_read
    ON contact_messages(read);
  ```

- [ ] **B-11.3** Tambah struct di `src/db/models.rs`

  ```rust
  #[derive(Debug, Deserialize)]
  pub struct ContactMessageRequest {
      pub name: String,      // max 100 chars
      pub email: String,     // valid email format
      pub subject: Option<String>,  // max 255 chars
      pub message: String,   // min 10, max 5000 chars
  }

  #[derive(Debug, Serialize, FromRow)]
  pub struct ContactMessage {
      pub id: Uuid,
      pub name: String,
      pub email: String,
      pub subject: Option<String>,
      pub message: String,
      pub ip_address: Option<String>,
      pub read: bool,
      pub created_at: DateTime<Utc>,
  }
  ```

- [ ] **B-11.4** Buat file `src/routes/contact.rs`
  - Handler `submit_contact`: `POST /api/contact`
  - Handler `list_messages`: `GET /api/admin/messages` (auth, for #19)
  - Handler `get_message`: `GET /api/admin/messages/:id` (auth, for #19)
  - Handler `update_message`: `PATCH /api/admin/messages/:id` (auth, for #19)
  - Handler `delete_message`: `DELETE /api/admin/messages/:id` (auth, for #19)

- [ ] **B-11.5** Implementasi `submit_contact` handler
  - Extract client IP dari `ConnectInfo<SocketAddr>` atau `X-Forwarded-For` header
  - Input validation:
    - `name`: 1–100 chars, trim whitespace
    - `email`: valid format (regex atau simple check)
    - `subject`: optional, max 255 chars
    - `message`: 10–5000 chars
  - Rate limit: 5 messages per IP per jam (in-memory HashMap + cleanup)
  - Simpan ke DB (tabel `contact_messages`)
  - Kirim email async via `lettre`:
    - To: `CONTACT_EMAIL` env var
    - From: `SMTP_USER` env var
    - Subject: `[Portfolio Contact] {subject or "New Message"} from {name}`
    - Body: plain text with name, email, subject, message
    - Reply-To: sender's email
  - Return 201 on success
  - Jika email gagal kirim: log error, TETAP return 201 (pesan sudah tersimpan di DB)

- [ ] **B-11.6** Buat email helper module `src/routes/email.rs` (atau inline di contact.rs)

  ```rust
  pub async fn send_contact_email(
      name: &str, email: &str, subject: &str, message: &str
  ) -> Result<(), Box<dyn std::error::Error>> {
      let smtp_host = std::env::var("SMTP_HOST")?;
      let smtp_port: u16 = std::env::var("SMTP_PORT")?.parse()?;
      let smtp_user = std::env::var("SMTP_USER")?;
      let smtp_password = std::env::var("SMTP_PASSWORD")?;
      let contact_email = std::env::var("CONTACT_EMAIL")?;
      // ... lettre transport setup
  }
  ```

- [ ] **B-11.7** Register route di `src/routes/mod.rs` dan `src/lib.rs`

  ```rust
  // mod.rs
  pub mod contact;

  // lib.rs
  .route("/api/contact", post(routes::contact::submit_contact))
  // routes untuk #19 (admin messages) bisa ditambah nanti
  ```

- [ ] **B-11.8** Tambah env vars ke `.env.example`
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your@gmail.com
  SMTP_PASSWORD=your-app-password
  CONTACT_EMAIL=inbox@yourdomain.com
  ```

### Frontend (`portfolio-frontend`)

- [ ] **F-11.1** Buat halaman `src/app/contact/page.tsx`
  - Server component dengan metadata SEO
  - Render `ContactForm` client component
  - Layout: centered, max-width 600px

- [ ] **F-11.2** Buat komponen `ContactForm` di `src/components/molecules/shared/contact-form.tsx`
  - Gunakan `react-hook-form` + `zod` resolver
  - Zod schema:
    ```typescript
    const contactSchema = z.object({
      name: z.string().min(1, "Name is required").max(100),
      email: z.string().email("Invalid email address"),
      subject: z.string().max(255).optional(),
      message: z
        .string()
        .min(10, "Message must be at least 10 characters")
        .max(5000),
    });
    ```
  - Fields:
    - Name: text input, required
    - Email: email input, required
    - Subject: text input, optional
    - Message: textarea, required, character counter (current/5000)
  - Submit:
    - `POST` ke `{NEXT_PUBLIC_API_URL}/api/contact`
    - Loading state: button disabled + spinner
    - Success: toast via `sonner`, reset form, tampilkan success banner
    - Error 429: toast "Too many messages. Please try again in 1 hour."
    - Error 422: tampilkan field-level errors
    - Network error: toast "Failed to send message. Please try again later."

- [ ] **F-11.3** Styling contact form
  - Terminal-like styling konsisten dengan design system
  - Labels: monospace font, muted color
  - Inputs: monospace, border, focus ring
  - Submit button: primary color, full width
  - Character counter: `text-xs text-muted-foreground`, warn ketika >4500

- [ ] **F-11.4** Tambah terminal command `contact`
  - Di command registry: `contact` → navigasi ke `/contact`
  - Output: "Opening contact form..." + redirect

- [ ] **F-11.5** SEO metadata di contact page

  ```typescript
  export const metadata: Metadata = {
    title: "Contact | Portfolio",
    description: "Get in touch with me. Send a message via the contact form.",
  };
  ```

- [ ] **F-11.6** Unit test `ContactForm`: validation, submit success/error states

---

## 📁 File Mapping

| File                                                                  | Aksi          | Deskripsi                          |
| --------------------------------------------------------------------- | ------------- | ---------------------------------- |
| `portfolio-backend/Cargo.toml`                                        | Modifikasi    | Tambah `lettre`                    |
| `portfolio-backend/src/db/mod.rs`                                     | Modifikasi    | Migration tabel `contact_messages` |
| `portfolio-backend/src/db/models.rs`                                  | Modifikasi    | Tambah structs contact             |
| `portfolio-backend/src/routes/contact.rs`                             | **Buat baru** | Contact + admin messages handlers  |
| `portfolio-backend/src/routes/mod.rs`                                 | Modifikasi    | Export `pub mod contact`           |
| `portfolio-backend/src/lib.rs`                                        | Modifikasi    | Register route `/api/contact`      |
| `portfolio-frontend/src/app/contact/page.tsx`                         | **Buat baru** | Contact page                       |
| `portfolio-frontend/src/components/molecules/shared/contact-form.tsx` | **Buat baru** | Form component                     |

---

## 🔌 API Contract

### `POST /api/contact`

```
Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Job Opportunity",
  "message": "Hi, I saw your portfolio and would like to discuss..."
}

Response 201:
{ "message": "Message sent successfully" }

Response 422:
{
  "error": "Validation failed",
  "fields": {
    "email": "Invalid email format",
    "message": "Message must be at least 10 characters"
  }
}

Response 429:
{ "error": "Too many messages. Please try again in 1 hour." }
```

### Email yang Dikirim (format)

```
From: SMTP_USER (e.g., portfolio@gmail.com)
To: CONTACT_EMAIL (e.g., developer@domain.com)
Reply-To: john@example.com
Subject: [Portfolio Contact] Job Opportunity from John Doe

---
Name: John Doe
Email: john@example.com
Subject: Job Opportunity
---

Hi, I saw your portfolio and would like to discuss...

---
Sent from Portfolio Contact Form
IP: 203.0.113.45
Time: 2026-02-21 10:30:00 UTC
```

---

## ✅ Acceptance Criteria

| #     | Kriteria                                                            | Cara Verifikasi               |
| ----- | ------------------------------------------------------------------- | ----------------------------- |
| AC-1  | Form submit → email masuk ke inbox developer                        | Send test message             |
| AC-2  | Pesan tersimpan di tabel `contact_messages`                         | Check DB                      |
| AC-3  | Rate limit: IP yang sama max 5 pesan per jam                        | Rapid submit test             |
| AC-4  | Validasi client-side: field kosong tampilkan error inline           | Form validation test          |
| AC-5  | Validasi server-side: reject invalid email, pesan terlalu pendek    | curl test                     |
| AC-6  | Halaman accessible via `/contact`                                   | Browser navigation            |
| AC-7  | Command `contact` di terminal → navigate ke contact page            | Terminal test                 |
| AC-8  | Toast success muncul setelah berhasil kirim                         | Visual check                  |
| AC-9  | Form di-reset setelah berhasil kirim                                | Visual check                  |
| AC-10 | Jika SMTP gagal, pesan tetap tersimpan di DB (graceful degradation) | Test with invalid SMTP config |

---

## 🔧 Technical Notes

### Rate Limiting Pattern

Reuse pattern dari `auth.rs`:

```rust
lazy_static::lazy_static! {
    static ref CONTACT_RATE_LIMIT: Arc<RwLock<HashMap<String, Vec<i64>>>> =
        Arc::new(RwLock::new(HashMap::new()));
}

async fn check_rate_limit(ip: &str) -> bool {
    let mut limits = CONTACT_RATE_LIMIT.write().await;
    let now = Utc::now().timestamp();
    let one_hour_ago = now - 3600;

    let timestamps = limits.entry(ip.to_string()).or_insert_with(Vec::new);
    timestamps.retain(|&t| t > one_hour_ago);

    if timestamps.len() >= 5 {
        return false; // rate limited
    }
    timestamps.push(now);
    true
}
```

### Graceful Email Failure

```rust
// Di submit_contact handler:
// 1. Simpan ke DB dulu
// 2. Spawn email task (non-blocking)
tokio::spawn(async move {
    if let Err(e) = send_contact_email(&name, &email, &subject, &message).await {
        tracing::error!("Failed to send contact email: {}", e);
        // Pesan sudah di DB, admin bisa lihat via inbox (#19)
    }
});
// 3. Return 201 immediately
```

### SMTP Testing

Untuk development, gunakan [Mailpit](https://github.com/axllent/mailpit) atau [MailHog](https://github.com/mailhog/MailHog):

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
CONTACT_EMAIL=test@localhost
``` -->

<!-- IM NOT USING THIS FEATURES -->
