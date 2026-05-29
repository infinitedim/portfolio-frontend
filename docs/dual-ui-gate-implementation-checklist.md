# Dual UI + Terminal Gate — Implementation Checklist (ARCHIVED)

> **ARCHIVED — superseded by [dual-ui-gate.md](./dual-ui-gate.md)**  
> This checklist described an earlier gate design (shellcode/L3 offset puzzles) that was **not implemented**.  
> The shipped gate uses NATAS-style web challenges only: L1 login, L2 hidden `/s3cr3t/users.txt`, L3 Referer from `/terminal`.

## Current reference

| Topic            | Document / code                                          |
| ---------------- | -------------------------------------------------------- |
| Operations & env | [dual-ui-gate.md](./dual-ui-gate.md)                     |
| Feature status   | [FEATURE_PLANNING.md](../FEATURE_PLANNING.md) — Sprint 5 |
| Frontend gate UI | `src/app/gate/`, `src/lib/gate/`                         |
| Backend gate API | `portfolio-backend/src/routes/gate.rs`                   |
| Env templates    | `.env.example` in both repos                             |

## Implemented checklist (summary)

- [x] Standard landing at `/`, gated terminal at `/terminal` (noindex)
- [x] Gate routes `/gate`, `/gate/1`–`/gate/3`, proxy `/s3cr3t/users.txt`
- [x] Backend `/api/gate/*` (status, login, complete/3, unlock, challenge file)
- [x] Cookie `portfolio_gate` + progress cookie; dev bypass via `GATE_BYPASS_SECRET` in Next.js `proxy.ts`
- [x] `.env.example` in frontend and backend aligned for gate vars

For historical implementation notes from the pre-NATAS design, see git history of this file before May 2026.
