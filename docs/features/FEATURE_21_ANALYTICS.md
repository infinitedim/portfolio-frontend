# Feature #21 — Visitor Analytics (Grafana)

**Status:** Done  
**Approach:** Prometheus metrics + Grafana dashboards (no custom `/admin/analytics` UI)

## Backend

- `src/metrics.rs` — HTTP middleware, business counters, `GET /metrics`
- `POST /api/analytics/pageview` — `{ path, slug? }`

## Frontend

- `src/components/layout/pageview-beacon.tsx` — mounted in `StandardPageLayout`
- Admin link: `NEXT_PUBLIC_GRAFANA_URL` on `/admin`

## Grafana (backend repo)

Provisioned dashboards under `config/grafana/dashboards/`:

- `application-overview.json`
- `errors.json`
- `performance.json`
- `security.json`

## Prometheus scrape

- Target: `portfolio-backend:8080` (path `/metrics`, interval 10s)
- Promtail metrics are exposed on `:9080` — that is **not** the backend API metrics endpoint
