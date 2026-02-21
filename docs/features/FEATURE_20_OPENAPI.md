# Feature #20 — OpenAPI / Swagger Dokumentasi

> **Prioritas:** 🟡 Sedang  
> **Estimasi:** FE 0 · BE 3 hari  
> **Dependencies:** Tidak ada (bisa dikerjakan paralel)  
> **Dependants:** Tidak ada

---

## 📋 Deskripsi

Auto-generate dokumentasi API interaktif dengan Swagger UI yang bisa diakses di `/api/docs`. Semua existing routes terdokumentasi dengan request/response schema, authentication requirements, dan contoh. Menggunakan `utoipa` + `utoipa-swagger-ui` crate.

### State Saat Ini

- Backend punya 15+ route handlers di:
  - `auth.rs`: register, login, verify, refresh, logout
  - `blog.rs`: list, get, create, update, delete, list_tags
  - `portfolio.rs`: get, update
  - `health.rs`: ping, detailed, database, redis, ready
  - `rss.rs`: rss_feed
  - `logs.rs`: receive_client_logs
- Semua request/response structs sudah pakai `serde` derive — cocok untuk auto-schema generation
- Tidak ada dokumentasi API formal saat ini

### Library Choice

**`utoipa`** (v4) dipilih karena:

- Native Axum integration via `utoipa-axum`
- Procedural macro approach: annotasi langsung di handler
- Auto-generate OpenAPI 3.1 spec
- Swagger UI bundled via `utoipa-swagger-ui`
- 2k+ GitHub stars, aktif dimaintain

---

## ✅ Subtask Checklist

### Backend (`portfolio-backend`)

- [ ] **B-20.1** Tambah dependencies di `Cargo.toml`

  ```toml
  utoipa = { version = "5", features = ["axum_extras", "uuid", "chrono"] }
  utoipa-swagger-ui = { version = "8", features = ["axum"] }
  ```

- [ ] **B-20.2** Derive `ToSchema` pada semua request/response structs di `src/db/models.rs`

  ```rust
  use utoipa::ToSchema;

  #[derive(Debug, Clone, FromRow, Serialize, Deserialize, ToSchema)]
  pub struct BlogPost { ... }

  #[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
  pub struct NewBlogPost { ... }

  // ... semua struct lainnya
  ```

- [ ] **B-20.3** Derive `ToSchema` pada route-specific structs di `src/routes/blog.rs`

  ```rust
  #[derive(Debug, Serialize, ToSchema)]
  pub struct BlogListResponse { ... }

  #[derive(Debug, Serialize, ToSchema)]
  pub struct BlogPostSummary { ... }

  #[derive(Debug, Serialize, ToSchema)]
  pub struct BlogPostResponse { ... }
  ```

- [ ] **B-20.4** Derive `ToSchema` pada auth structs di `src/routes/auth.rs`

  ```rust
  #[derive(Debug, Deserialize, Serialize, ToSchema)]
  pub struct LoginRequest { ... }

  #[derive(Debug, Serialize, ToSchema)]
  pub struct LoginResponse { ... }

  // ... register, refresh, verify structs
  ```

- [ ] **B-20.5** Derive `ToSchema` pada `ErrorResponse` di `src/routes/mod.rs`

- [ ] **B-20.6** Anotasi `#[utoipa::path(...)]` pada setiap handler — **AUTH routes**

  ```rust
  #[utoipa::path(
      post,
      path = "/api/auth/login",
      request_body = LoginRequest,
      responses(
          (status = 200, description = "Login successful", body = LoginResponse),
          (status = 401, description = "Invalid credentials", body = ErrorResponse),
          (status = 429, description = "Too many attempts", body = ErrorResponse),
      ),
      tag = "Authentication"
  )]
  pub async fn login(...) { ... }
  ```

  - `/api/auth/register` — tag: Authentication
  - `/api/auth/login` — tag: Authentication
  - `/api/auth/verify` — tag: Authentication, security: Bearer
  - `/api/auth/refresh` — tag: Authentication
  - `/api/auth/logout` — tag: Authentication, security: Bearer

- [ ] **B-20.7** Anotasi handlers — **BLOG routes**

  ```rust
  #[utoipa::path(
      get,
      path = "/api/blog",
      params(BlogListQuery),
      responses(
          (status = 200, description = "Blog posts list", body = BlogListResponse),
      ),
      tag = "Blog"
  )]
  pub async fn list_posts(...) { ... }
  ```

  - `GET /api/blog` — tag: Blog
  - `GET /api/blog/tags` — tag: Blog
  - `GET /api/blog/{slug}` — tag: Blog
  - `POST /api/blog` — tag: Blog, security: Bearer
  - `PATCH /api/blog/{slug}` — tag: Blog, security: Bearer
  - `DELETE /api/blog/{slug}` — tag: Blog, security: Bearer

- [ ] **B-20.8** Anotasi handlers — **PORTFOLIO routes**
  - `GET /api/portfolio` — tag: Portfolio
  - `PATCH /api/portfolio` — tag: Portfolio, security: Bearer

- [ ] **B-20.9** Anotasi handlers — **HEALTH routes**
  - `GET /health` — tag: Health
  - `GET /health/detailed` — tag: Health
  - `GET /health/database` — tag: Health
  - `GET /health/redis` — tag: Health
  - `GET /health/ready` — tag: Health

- [ ] **B-20.10** Anotasi handlers — **RSS & LOGS routes**
  - `GET /api/rss` — tag: RSS
  - `POST /api/logs` — tag: Logging

- [ ] **B-20.11** Buat file `src/openapi.rs` — ApiDoc definisi

  ```rust
  use utoipa::OpenApi;

  #[derive(OpenApi)]
  #[openapi(
      info(
          title = "Portfolio API",
          version = "1.0.0",
          description = "REST API for the Portfolio application. Built with Rust + Axum.",
          contact(
              name = "Dimas Saputra",
              email = "developer@infinitedim.site",
              url = "https://infinitedim.site"
          ),
          license(name = "MIT")
      ),
      servers(
          (url = "http://localhost:3001", description = "Local development"),
          (url = "https://api.infinitedim.site", description = "Production")
      ),
      tags(
          (name = "Authentication", description = "Admin authentication endpoints"),
          (name = "Blog", description = "Blog posts CRUD operations"),
          (name = "Portfolio", description = "Portfolio sections management"),
          (name = "Health", description = "Service health checks"),
          (name = "RSS", description = "RSS feed generation"),
          (name = "Logging", description = "Client-side log ingestion"),
      ),
      security(
          ("bearer_auth" = [])
      ),
      components(
          security_schemes(
              ("bearer_auth" = (
                  ty = "Http",
                  scheme = "bearer",
                  bearer_format = "JWT",
                  description = "JWT access token obtained from /api/auth/login"
              ))
          )
      ),
      paths(
          // Auth
          routes::auth::login,
          routes::auth::register,
          routes::auth::verify_token,
          routes::auth::refresh,
          routes::auth::logout,
          // Blog
          routes::blog::list_posts,
          routes::blog::get_post,
          routes::blog::create_post,
          routes::blog::update_post,
          routes::blog::delete_post,
          routes::blog::list_tags,
          // Portfolio
          routes::portfolio::get_portfolio,
          routes::portfolio::update_portfolio,
          // Health
          routes::health::health_ping,
          routes::health::health_detailed,
          routes::health::health_database,
          routes::health::health_redis,
          routes::health::health_ready,
          // RSS
          routes::rss::rss_feed,
          // Logs
          routes::logs::receive_client_logs,
      )
  )]
  pub struct ApiDoc;
  ```

- [ ] **B-20.12** Mount SwaggerUI di `src/lib.rs`

  ```rust
  use utoipa_swagger_ui::SwaggerUi;
  use crate::openapi::ApiDoc;

  // Di create_app():
  let app = Router::new()
      // ... existing routes ...
      .merge(SwaggerUi::new("/api/docs/{_:.*}")
          .url("/api/docs/openapi.json", ApiDoc::openapi()))
      // ... layers ...
  ```

- [ ] **B-20.13** Environment flag untuk production

  ```rust
  let enable_swagger = std::env::var("ENABLE_SWAGGER_UI")
      .unwrap_or_else(|_| "true".to_string()) == "true";

  let app = if enable_swagger {
      app.merge(SwaggerUi::new("/api/docs/{_:.*}")
          .url("/api/docs/openapi.json", ApiDoc::openapi()))
  } else {
      app
  };
  ```

  - Default: enabled
  - Production: set `ENABLE_SWAGGER_UI=false` to disable

- [ ] **B-20.14** Derive `IntoParams` pada query param structs

  ```rust
  #[derive(Debug, Deserialize, IntoParams)]
  pub struct BlogListQuery {
      #[param(default = 1)]
      pub page: i64,
      #[param(default = 10)]
      pub page_size: i64,
      pub published: Option<bool>,
      pub search: Option<String>,
      pub tag: Option<String>,
      pub sort: Option<String>,
  }
  ```

- [ ] **B-20.15** Compile test: pastikan `cargo build` berhasil dengan semua annotations

---

## 📁 File Mapping

| File                                        | Aksi          | Deskripsi                                                 |
| ------------------------------------------- | ------------- | --------------------------------------------------------- |
| `portfolio-backend/Cargo.toml`              | Modifikasi    | Tambah `utoipa`, `utoipa-swagger-ui`                      |
| `portfolio-backend/src/openapi.rs`          | **Buat baru** | OpenAPI spec definition                                   |
| `portfolio-backend/src/lib.rs`              | Modifikasi    | Mount SwaggerUI, export openapi mod                       |
| `portfolio-backend/src/db/models.rs`        | Modifikasi    | Derive `ToSchema` pada semua struct                       |
| `portfolio-backend/src/routes/mod.rs`       | Modifikasi    | Derive `ToSchema` pada `ErrorResponse`                    |
| `portfolio-backend/src/routes/auth.rs`      | Modifikasi    | `#[utoipa::path]` annotations + `ToSchema`                |
| `portfolio-backend/src/routes/blog.rs`      | Modifikasi    | `#[utoipa::path]` annotations + `ToSchema` + `IntoParams` |
| `portfolio-backend/src/routes/portfolio.rs` | Modifikasi    | `#[utoipa::path]` annotations                             |
| `portfolio-backend/src/routes/health.rs`    | Modifikasi    | `#[utoipa::path]` annotations                             |
| `portfolio-backend/src/routes/rss.rs`       | Modifikasi    | `#[utoipa::path]` annotations                             |
| `portfolio-backend/src/routes/logs.rs`      | Modifikasi    | `#[utoipa::path]` annotations                             |

---

## 🔌 API Contract

### `GET /api/docs/`

Swagger UI HTML page — interactive API documentation.

### `GET /api/docs/openapi.json`

Raw OpenAPI 3.1 JSON spec. Bisa diimport ke Postman, Insomnia, dll.

---

## ✅ Acceptance Criteria

| #     | Kriteria                                                                                           | Cara Verifikasi               |
| ----- | -------------------------------------------------------------------------------------------------- | ----------------------------- |
| AC-1  | Swagger UI aksesibel di `http://localhost:3001/api/docs/`                                          | Browser check                 |
| AC-2  | Semua endpoint ter-list dan tergroup berdasarkan tag (Auth, Blog, Portfolio, Health, RSS, Logging) | Visual check                  |
| AC-3  | Request/response schema ter-generate otomatis dari structs                                         | Click endpoint → check schema |
| AC-4  | Endpoint yang butuh auth: ada lock icon 🔒                                                         | Visual check                  |
| AC-5  | "Try it out" berfungsi: bisa kirim request langsung dari docs                                      | Test GET /health              |
| AC-6  | Bearer token bisa diinput via "Authorize" button → locked endpoints bisa di-test                   | Auth test                     |
| AC-7  | OpenAPI JSON accessible di `/api/docs/openapi.json`                                                | curl test                     |
| AC-8  | Production: `ENABLE_SWAGGER_UI=false` → docs tidak aksesibel                                       | Env flag test                 |
| AC-9  | Blog query params (page, pageSize, tag, search) terdokumentasi                                     | Check blog endpoint           |
| AC-10 | Compile berhasil tanpa warning dari utoipa annotations                                             | `cargo build` test            |

---

## 🔧 Technical Notes

### Utoipa Version Compatibility

- `utoipa` v5 + `utoipa-swagger-ui` v8 (latest as of 2026)
- Pastikan Axum 0.8 compatibility: gunakan feature `axum_extras`
- Jika ada issue, fallback ke `utoipa` v4 + `utoipa-swagger-ui` v7

### Annotation Order

Utoipa macro `#[utoipa::path(...)]` harus diletakkan **di atas** `pub async fn`:

```rust
#[utoipa::path(...)]
pub async fn handler(...) -> impl IntoResponse { ... }
```

### Common Pitfalls

1. **serde `rename_all = "camelCase"`**: utoipa respects serde attributes, schema akan menampilkan camelCase field names ✅
2. **Option fields**: utoipa auto-marks sebagai `nullable` ✅
3. **Vec<T>**: utoipa auto-maps ke array ✅
4. **DateTime<Utc>**: perlu feature `chrono` di utoipa config ✅
5. **Custom extractors**: `ConnectInfo<SocketAddr>` tidak perlu documented, skip di annotation

### Incremental Approach

Bisa dikerjakan incremental per route group:

1. Day 1: Setup + Health routes + Blog routes (terbanyak)
2. Day 2: Auth routes + Portfolio routes
3. Day 3: RSS + Logs + polish + production flag + testing

### Example: Full Blog List Annotation

```rust
#[utoipa::path(
    get,
    path = "/api/blog",
    params(BlogListQuery),
    responses(
        (status = 200, description = "Paginated list of blog posts", body = BlogListResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse),
    ),
    tag = "Blog",
    summary = "List blog posts",
    description = "Returns a paginated list of blog posts. Filter by published status, tags, or search query."
)]
pub async fn list_posts(Query(params): Query<BlogListQuery>) -> impl IntoResponse {
    // ...
}
```
