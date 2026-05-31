# Security Policy

## Supported Versions

The following versions of this project are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of this project seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Send a detailed report to: **<security@dimasptra.my.id>** (or create a private security advisory on GitHub)
3. Include the following information:
   - Type of vulnerability (e.g., XSS, SQL Injection, CSRF, etc.)
   - Full path(s) of the affected source file(s)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if available)
   - Potential impact of the vulnerability

### What to Expect

- **Initial Response**: Within 48 hours of your report
- **Status Update**: Within 7 days with an assessment of the vulnerability
- **Resolution Timeline**: Critical vulnerabilities will be addressed within 14 days; others within 30 days

### After Reporting

1. We will acknowledge receipt of your report
2. We will investigate and validate the vulnerability
3. We will work on a fix and coordinate disclosure timing with you
4. We will credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

This project implements the following security measures:

### Authentication & Authorization

- JWT-based access tokens (HS256, 15-minute lifetime, signed with a 256-bit
  HMAC secret enforced at startup).
- Refresh tokens are delivered as **HttpOnly, Secure, SameSite=Strict**
  cookies scoped to `/api/auth`. They are never exposed to JavaScript and
  cannot be read or written through `document.cookie`, `sessionStorage`,
  or `localStorage`.
- Rotating refresh tokens: every successful `/api/auth/refresh` revokes the
  presented token and issues a new one (single-use, replay-resistant).
- Bcrypt password hashing with appropriate salt rounds.
- Rate limiting on authentication endpoints (per IP, per endpoint label).
- Token issuer/audience validation (`iss`, `aud`) plus required claims
  (`exp`, `iat`, `sub`) on every verify.
- Role-based access control on all admin mutations via a centralised
  `require_admin` helper.

### Input Validation & Sanitization

- Input validation on all user-provided data
- XSS protection through content sanitization
- SQL injection prevention via parameterized queries (SQLx on the Rust/Axum backend)
- CSRF risk reduced via SameSite=Strict refresh cookies + backend CORS allowlist (no separate CSRF token layer).

### Infrastructure Security

- HTTPS enforcement in production
- Security headers via Next.js proxy (`src/proxy.ts`) and `next.config.ts` (HSTS, X-Frame-Options, etc.).
- **Content-Security-Policy (PPR):** Production uses `script-src 'self' 'unsafe-inline'` (no `strict-dynamic` / per-request nonce) so Next.js PPR static shell scripts under `/_next/static/` are not blocked. Tight `connect-src` still limits API calls to `NEXT_PUBLIC_API_URL`.
- Environment variable protection for sensitive data
- Regular dependency updates and vulnerability scanning

### Vercel production deploy verification

After changing `BACKEND_URL`, `NEXT_PUBLIC_API_URL`, or CSP-related code, redeploy **Production** (not Preview only) and verify:

```bash
# connect-src must list the current Cloud Run host (843865911939), not legacy 1086149692502
curl -sI https://infinitedim.vercel.app/roadmap | grep -i content-security-policy

# roadmap proxy should respond within 15s (502 if ROADMAP_* secrets missing)
curl -m 15 https://portfolio-backend-843865911939.asia-southeast2.run.app/api/roadmap/dashboard
```

Required Production env vars on Vercel:

```env
BACKEND_URL=https://portfolio-backend-843865911939.asia-southeast2.run.app
NEXT_PUBLIC_API_URL=https://portfolio-backend-843865911939.asia-southeast2.run.app
NEXT_PUBLIC_BASE_URL=https://infinitedim.vercel.app
```

E2E checks live in `e2e/security-headers.spec.ts` (CSP shape, stale backend host, chunk script load).

### Monitoring & Logging

- Security event logging
- Rate limiting and abuse detection
- Error handling that doesn't expose sensitive information

## Scope

### In Scope

- The main portfolio website and API
- Authentication and session management
- Data handling and storage
- Third-party integrations (GitHub API)

### Out of Scope

- Third-party services and their vulnerabilities
- Social engineering attacks
- Physical security
- Denial of service attacks

## Security Updates

Security updates will be released as patch versions and announced through:

- GitHub Security Advisories
- Release notes

## Contact

For security-related inquiries:

- Email: <security@dimasptra.my.id>
- GitHub: [@infinitedim](https://github.com/infinitedim)

## Acknowledgments

We appreciate the security research community's efforts in helping keep this project secure. Contributors who responsibly disclose vulnerabilities will be acknowledged here (with permission).

---

Thank you for helping keep this project and its users safe!
