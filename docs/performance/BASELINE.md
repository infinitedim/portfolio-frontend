# Performance Baseline

> **Created:** May 2026  
> **Purpose:** Reference for Lighthouse and bundle regression gates in CI.

## How to measure

```bash
cd portfolio-frontend
bun run build
bun run perf:lighthouse          # desktop (3 runs, median)
bun run perf:lighthouse:mobile     # mobile throttled
ANALYZE=true bun run build         # webpack bundle analyzer
```

Artifacts:

- Desktop: `/tmp/verify-this/cwv-baseline/`
- Mobile: `/tmp/verify-this/cwv-baseline-mobile/`

## Initial baseline (pre-sprint)

Captured before Frontend Performance Sprint implementation. Re-run commands above after each phase to update.

| Route       | Desktop Perf | Mobile Perf | LCP (ms) | CLS | Notes                         |
| ----------- | ------------ | ----------- | -------- | --- | ----------------------------- |
| `/`         | TBD          | TBD         | TBD      | TBD | Run `perf:lighthouse` locally |
| `/blog`     | TBD          | TBD         | TBD      | TBD |                               |
| `/projects` | TBD          | TBD         | TBD      | TBD |                               |

## Bundle budgets (per-route, first-load JS)

| Route         | Baseline KB | Budget KB         | Heavy route? |
| ------------- | ----------- | ----------------- | ------------ |
| `/`           | TBD         | -5% vs main in CI | No           |
| `/blog`       | TBD         | soft              | No           |
| `/terminal`   | TBD         | best-effort       | Yes          |
| `/playground` | TBD         | best-effort       | Yes          |
| `/admin/*`    | TBD         | best-effort       | Yes          |

CI uses `transferwise/actions-next-bundle-analyzer` on PRs for `/` regression tracking.

## Acceptance targets (post-sprint)

| Route                  | LCP         | INP     | CLS   | Lighthouse Perf |
| ---------------------- | ----------- | ------- | ----- | --------------- |
| `/`                    | < 2.5s      | < 200ms | < 0.1 | ≥ 90            |
| `/blog`                | < 2.5s      | < 200ms | < 0.1 | ≥ 85            |
| `/blog/[slug]`         | < 2.5s      | < 200ms | < 0.1 | ≥ 85            |
| `/terminal` (unlocked) | best-effort | < 200ms | < 0.1 | ≥ 70            |

## Related docs

- [FEATURE_33_PERFORMANCE.md](../features/FEATURE_33_PERFORMANCE.md)
- [Grafana CWV dashboard JSON](./grafana-cwv-dashboard.json)
- [LogQL CWV queries](../logging/QUERYING.md)
