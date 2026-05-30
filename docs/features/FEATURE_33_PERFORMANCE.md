# FEATURE 33 — Frontend Performance & Core Web Vitals

> **Status:** Implemented (May 2026)  
> **Scope:** `portfolio-frontend` only

## Summary

Performance sprint covering bundle optimization, PPR (`cacheComponents`), dual RUM (Loki + Vercel Speed Insights), Lighthouse/bundle CI gates, and CWV-focused landing/blog improvements.

## Commands

```bash
cd portfolio-frontend
bun run perf:analyze          # webpack bundle analyzer
bun run perf:lighthouse       # desktop Lighthouse CI (3 runs)
bun run perf:lighthouse:mobile
bun run lint && bun run type-check
```

## Key files

| Area                                      | Path                                                |
| ----------------------------------------- | --------------------------------------------------- |
| Next config (PPR, optimizePackageImports) | `next.config.ts`                                    |
| Cached blog fetch                         | `src/lib/services/cached-blog-fetch.ts`             |
| Web Vitals RUM                            | `src/lib/logger/web-vitals.ts`                      |
| Speed Insights                            | `src/components/layout/client-only-components.tsx`  |
| Deferred AI chat                          | `src/components/layout/deferred-ai-chat-widget.tsx` |
| Lighthouse CI                             | `lighthouserc.js`, `lighthouserc.mobile.js`         |
| Baseline doc                              | `docs/performance/BASELINE.md`                      |
| Grafana dashboard                         | `docs/performance/grafana-cwv-dashboard.json`       |

## Acceptance

- `/` hero is a Server Component (LCP-friendly heading in HTML)
- Auth context scoped to `/admin/*` only
- Sandpack, TipTap, AiChatWidget dynamically loaded
- `cacheComponents: true` with explicit `force-dynamic` on gate/terminal/admin/playground
- Dual RUM: pino/Loki + `@vercel/speed-insights` in production
- CI: bundle analyzer job + Lighthouse desktop (warn thresholds)

## Observability

- **Loki:** `{service="frontend", component="web-vitals"}` with `route`, `rating`, `value`
- **Vercel:** Speed Insights dashboard on production deploys
- **Grafana:** import `docs/performance/grafana-cwv-dashboard.json`

## Env

No new required secrets. Speed Insights activates automatically on Vercel. Optional:

```env
NEXT_PUBLIC_GRAFANA_URL=http://localhost:3001
```
