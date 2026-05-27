# Feature #21 — Visitor Analytics (Grafana)

**Status:** Done  
**Approach:** Prometheus metrics + Grafana dashboards (no custom `/admin/analytics` UI)

## Backend

- `src/metrics.rs` — HTTP middleware, business counters, `GET /metrics`
- `POST /api/analytics/pageview` — `{ path, slug? }`

## Frontend

- `src/components/layout/pageview-beacon.tsx` — mounted in `StandardPageLayout`
- Admin link: `NEXT_PUBLIC_GRAFANA_URL` on `/admin`

## Grafana

- Dashboard: `config/grafana/dashboards/visitor-traffic.json` (backend repo)
- Scrape: Prometheus → `portfolio-backend:9080/metrics`
