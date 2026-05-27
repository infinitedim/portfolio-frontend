# Feature #26 — GitHub Stats Proxy

**Status:** Done

## Backend

- `GET /api/github/user/:username`, `GET /api/github/stats/:username`
- Server `GH_TOKEN`, 5min cache

## Frontend

- `github-service.ts` uses backend proxy instead of direct `api.github.com`
