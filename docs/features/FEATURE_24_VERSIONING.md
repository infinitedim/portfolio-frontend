# Feature #24 — Portfolio Versioning

**Status:** Done

## Backend

- Table `portfolio_versions`; snapshot on `PATCH /api/portfolio`
- `GET /api/admin/portfolio/versions?section=`, `POST .../restore`

## Frontend

- `/admin/portfolio` — history list + restore
