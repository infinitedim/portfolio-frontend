# Feature #16 — 2FA (TOTP) untuk Admin Login

> **Prioritas:** 🔴 Tinggi (security)  
> **Estimasi:** FE 2 hari · BE 3 hari  
> **Dependencies:** Tidak ada  
> **Dependants:** Tidak ada

---

## 📋 Deskripsi

Two-Factor Authentication berbasis TOTP (Time-based One-Time Password) untuk admin login. Setelah setup, setiap login wajib memasukkan kode 6-digit dari authenticator app (Google Authenticator, Authy, dll). Termasuk backup codes untuk recovery.

### State Saat Ini

- Auth flow: `POST /api/auth/login` → return `access_token` + `refresh_token`
- Password hashing: bcrypt via `bcrypt` crate
- JWT: `jsonwebtoken` crate, 15 min access token, 7 day refresh token
- Claims struct: `sub`, `email`, `role`, `exp`, `iat`
- In-memory refresh token store via `lazy_static` HashMap
- `AdminUser` model sudah ada: `id`, `email`, `password_hash`, `role`, dll
- Frontend: `input-otp` (v1.4.2) sudah terinstall di `package.json` — sempurna untuk TOTP code input
- Login page: `src/app/admin/login/page.tsx`

### Security Considerations

- `temp_token` (partial auth) HARUS short-lived (5 menit max)
- TOTP secret disimpan encrypted di DB (atau minimal only accessible via auth endpoints)
- Backup codes di-hash dengan bcrypt (single-use, hapus setelah pakai)
- Rate limit pada TOTP verification: maks 5 attempts per temp_token
- Brute force protection: lockout setelah 5 gagal TOTP verification

---

## ✅ Subtask Checklist

### Backend (`portfolio-backend`)

- [ ] **B-16.1** Tambah dependencies di `Cargo.toml`

  ```toml
  totp-rs = { version = "5", features = ["gen_secret", "qr"] }
  data-encoding = "2"  # untuk base32 encoding
  ```

- [ ] **B-16.2** SQL migration: tambah kolom 2FA ke `admin_users`

  ```sql
  ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS totp_secret TEXT,
    ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS totp_backup_codes TEXT[];
  ```

- [ ] **B-16.3** Update `AdminUser` struct di `src/db/models.rs`

  ```rust
  pub totp_secret: Option<String>,
  pub totp_enabled: bool,
  pub totp_backup_codes: Option<Vec<String>>,
  ```

- [ ] **B-16.4** Buat helper module `src/routes/totp.rs` (atau section di `auth.rs`)
  - `generate_totp_secret()` → return (secret_base32, qr_code_png_bytes)
  - `verify_totp_code(secret: &str, code: &str)` → bool (allow 1 step time skew)
  - `generate_backup_codes(count: usize)` → Vec<String> (format: `xxxx-xxxx`, 8 codes)
  - `hash_backup_code(code: &str)` → String (bcrypt)
  - `verify_backup_code(code: &str, hashes: &[String])` → Option<usize> (index matched)

- [ ] **B-16.5** Modifikasi `POST /api/auth/login` di `src/routes/auth.rs`
  - Setelah password valid, cek `admin_user.totp_enabled`
  - Jika `false`: login sukses seperti biasa (backward compatible)
  - Jika `true`: return `{ "requires2fa": true, "tempToken": "..." }`
  - `temp_token`: JWT dengan claims `{ sub, email, role, partial_auth: true, exp: now + 5min }`
  - **JANGAN** return `access_token` atau `refresh_token` pada tahap ini

- [ ] **B-16.6** Endpoint `POST /api/auth/2fa/verify-login`

  ```
  Request: { "tempToken": "...", "code": "123456" }
  ```

  - Decode `temp_token`, verify `partial_auth: true` dan belum expired
  - Lookup admin user dari `sub` claim
  - Verify TOTP code against stored secret
  - Jika code = backup code → verify against backup hashes, hapus yang matched
  - Jika valid → generate & return full `access_token` + `refresh_token`
  - Jika invalid → 401 + increment failed attempts counter
  - Rate limit: max 5 attempts per temp_token (track in-memory)

- [ ] **B-16.7** Endpoint `POST /api/auth/2fa/setup` (auth required — full JWT)

  ```
  Response: {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeDataUrl": "data:image/png;base64,...",
    "backupCodes": ["a1b2-c3d4", "e5f6-g7h8", ...]
  }
  ```

  - Generate TOTP secret
  - Generate QR code PNG → base64 data URL
  - Generate 8 backup codes
  - **JANGAN** enable 2FA dulu — tunggu confirm

- [ ] **B-16.8** Endpoint `POST /api/auth/2fa/confirm` (auth required)

  ```
  Request: { "code": "123456" }
  ```

  - Verify kode TOTP pertama kali terhadap secret yang baru di-generate
  - Jika valid: set `totp_enabled = true`, simpan hashed backup codes ke DB
  - Jika invalid: 400, user harus coba scan QR lagi

- [ ] **B-16.9** Endpoint `POST /api/auth/2fa/disable` (auth required)

  ```
  Request: { "code": "123456" }  // TOTP code atau backup code
  ```

  - Verify kode
  - Set `totp_enabled = false`, clear `totp_secret` dan `totp_backup_codes`
  - Return success

- [ ] **B-16.10** Register semua route baru di `src/lib.rs`
  ```rust
  .route("/api/auth/2fa/verify-login", post(routes::auth::verify_2fa_login))
  .route("/api/auth/2fa/setup", post(routes::auth::setup_2fa))
  .route("/api/auth/2fa/confirm", post(routes::auth::confirm_2fa))
  .route("/api/auth/2fa/disable", post(routes::auth::disable_2fa))
  ```

### Frontend (`portfolio-frontend`)

- [ ] **F-16.1** Buat komponen `TotpInput` di `src/components/molecules/admin/totp-input.tsx`
  - Gunakan `input-otp` yang sudah terinstall
  - 6 slot input
  - Auto-submit saat 6 digit terisi
  - Paste support (paste "123456" → auto-fill semua slot)
  - Clear button
  - Error state: shake animation + red border

- [ ] **F-16.2** Update `src/app/admin/login/page.tsx`
  - State machine: `idle` → `credentials` → `2fa-required` → `authenticated`
  - Setelah login berhasil, cek response:
    - Jika `requires2fa: true` → render `TotpInput` view, simpan `tempToken` di state
    - Jika access_token → redirect ke dashboard (existing flow)
  - Submit TOTP: `POST /api/auth/2fa/verify-login` dengan `tempToken` + `code`
  - Error handling: "Invalid code", "Code expired, please login again"
  - Back button: kembali ke credential form

- [ ] **F-16.3** Buat halaman `src/app/admin/dashboard/security/page.tsx`
  - Section "Two-Factor Authentication"
  - Status badge: "Enabled" (green) atau "Disabled" (gray)
  - Button "Enable 2FA" → trigger setup flow
  - Button "Disable 2FA" → confirmation modal + TOTP input

- [ ] **F-16.4** Buat komponen `TwoFactorSetup` di `src/components/molecules/admin/two-factor-setup.tsx`
  - Step 1: "Scan QR Code" — tampilkan QR code image dari base64
  - Step 2: "Manual entry" (collapsible) — tampilkan secret string bisa di-copy
  - Step 3: "Verify" — input TOTP code untuk konfirmasi, call `POST /api/auth/2fa/confirm`
  - Step 4: "Backup Codes" — tampilkan 8 codes dalam grid, tombol "Copy All", tombol "Download as text"
  - Warning: "Simpan backup codes ini. Setelah halaman ditutup, kode tidak bisa dilihat lagi."

- [ ] **F-16.5** Buat komponen `BackupCodesDisplay` di `src/components/molecules/admin/backup-codes-display.tsx`
  - Grid 2 kolom × 4 baris
  - Font monospace
  - Copy all button
  - Download as `.txt` file button
  - Print button (opsional)

- [ ] **F-16.6** Navigasi admin: tambah link "Security" di sidebar admin
  - Path: `/admin/dashboard/security`
  - Icon: shield/lock dari `lucide-react`

- [ ] **F-16.7** Unit test `TotpInput`, `TwoFactorSetup`, dan login 2FA flow

---

## 📁 File Mapping

| File                                                                         | Aksi          | Deskripsi                                 |
| ---------------------------------------------------------------------------- | ------------- | ----------------------------------------- |
| `portfolio-backend/Cargo.toml`                                               | Modifikasi    | Tambah `totp-rs`, `data-encoding`         |
| `portfolio-backend/src/db/mod.rs`                                            | Modifikasi    | Migration tambah kolom 2FA                |
| `portfolio-backend/src/db/models.rs`                                         | Modifikasi    | Update `AdminUser` struct                 |
| `portfolio-backend/src/routes/auth.rs`                                       | Modifikasi    | Update login handler, tambah 2FA handlers |
| `portfolio-backend/src/lib.rs`                                               | Modifikasi    | Register 4 route baru                     |
| `portfolio-frontend/src/components/molecules/admin/totp-input.tsx`           | **Buat baru** | 6-digit OTP input                         |
| `portfolio-frontend/src/components/molecules/admin/two-factor-setup.tsx`     | **Buat baru** | QR code + verify flow                     |
| `portfolio-frontend/src/components/molecules/admin/backup-codes-display.tsx` | **Buat baru** | Backup codes grid                         |
| `portfolio-frontend/src/app/admin/login/page.tsx`                            | Modifikasi    | Handle 2FA step in login flow             |
| `portfolio-frontend/src/app/admin/dashboard/security/page.tsx`               | **Buat baru** | 2FA settings page                         |

---

## 🔌 API Contract

### `POST /api/auth/login` (modified response)

**Jika 2FA disabled (existing, backward compatible):**

```json
{
  "success": true,
  "user": { "userId": "...", "email": "...", "role": "ADMIN" },
  "accessToken": "eyJ...",
  "refreshToken": "..."
}
```

**Jika 2FA enabled (NEW):**

```json
{
  "success": true,
  "requires2fa": true,
  "tempToken": "eyJ..."
}
```

### `POST /api/auth/2fa/verify-login`

```
Request:  { "tempToken": "eyJ...", "code": "123456" }
Response 200: { "success": true, "user": {...}, "accessToken": "...", "refreshToken": "..." }
Response 401: { "error": "Invalid TOTP code" }
Response 401: { "error": "Temporary token expired. Please login again." }
Response 429: { "error": "Too many attempts. Please login again." }
```

### `POST /api/auth/2fa/setup` (requires Bearer token)

```
Response 200:
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeDataUrl": "data:image/png;base64,iVBORw...",
  "backupCodes": ["a1b2-c3d4", "e5f6-g7h8", "i9j0-k1l2", "m3n4-o5p6", "q7r8-s9t0", "u1v2-w3x4", "y5z6-a7b8", "c9d0-e1f2"]
}
```

### `POST /api/auth/2fa/confirm` (requires Bearer token)

```
Request:  { "code": "123456" }
Response 200: { "success": true, "message": "2FA enabled successfully" }
Response 400: { "error": "Invalid code. Please scan the QR code again and try." }
```

### `POST /api/auth/2fa/disable` (requires Bearer token)

```
Request:  { "code": "123456" }
Response 200: { "success": true, "message": "2FA disabled" }
Response 401: { "error": "Invalid code" }
```

---

## ✅ Acceptance Criteria

| #     | Kriteria                                                           | Cara Verifikasi    |
| ----- | ------------------------------------------------------------------ | ------------------ |
| AC-1  | Admin tanpa 2FA: login flow tetap sama seperti sekarang            | Regression test    |
| AC-2  | Admin enable 2FA: QR code bisa di-scan dengan Google Authenticator | Manual test mobile |
| AC-3  | Admin dengan 2FA enabled: login memerlukan password + TOTP code    | Manual test        |
| AC-4  | TOTP code yang salah ditolak dengan pesan error jelas              | Manual test        |
| AC-5  | `temp_token` expired setelah 5 menit → user harus login ulang      | Wait 5 min test    |
| AC-6  | Backup code bisa digunakan sebagai pengganti TOTP (single-use)     | Manual test        |
| AC-7  | Backup code yang sudah dipakai tidak bisa dipakai lagi             | Manual test        |
| AC-8  | Disable 2FA berhasil setelah verify code                           | Manual test        |
| AC-9  | Max 5 TOTP attempts per temp_token → lockout                       | Brute force test   |
| AC-10 | Backup codes ditampilkan HANYA sekali saat setup                   | UI flow test       |

---

## 🔧 Technical Notes

### TOTP Parameters

```rust
TOTP::new(
    Algorithm::SHA1,
    6,          // digits
    1,          // skew (allow 1 step before/after)
    30,         // step in seconds
    secret,
    Some("Portfolio Admin".to_string()),
    user_email.to_string(),
)
```

### Temp Token Claims

```rust
#[derive(Serialize, Deserialize)]
struct PartialAuthClaims {
    sub: String,        // admin user id
    email: String,
    role: String,
    partial_auth: bool, // always true
    exp: i64,           // now + 300 seconds (5 min)
    iat: i64,
}
```

### Security Flow Diagram

```
User                    Frontend                Backend
  |--- email+pass ------->|                        |
  |                        |-- POST /auth/login --->|
  |                        |<-- requires2fa: true --|
  |                        |    tempToken           |
  |<-- Show TOTP input ----|                        |
  |--- 6-digit code ------>|                        |
  |                        |-- POST /2fa/verify --->|
  |                        |<-- accessToken --------|
  |<-- Redirect dashboard -|                        |
```

### Backup Code Format

- 8 codes, format `xxxx-xxxx` (lowercase alphanumeric)
- Generated with cryptographically secure random
- Stored as bcrypt hashes in `TEXT[]` column
- On use: find matching hash, remove from array, update DB
