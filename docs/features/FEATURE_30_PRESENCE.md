# Feature #30 — Real-time Visitor Presence

**Status:** Done

## Backend

- WebSocket `GET /ws/presence` — Redis-backed room counts when `REDIS_URL` is set; in-memory fallback otherwise (heartbeat Ping extends conn TTL 90s)

## Frontend

- `src/components/molecules/presence/visitor-presence-badge.tsx` in site nav
