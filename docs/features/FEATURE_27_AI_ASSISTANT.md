# Feature #27 — AI Portfolio Assistant (Gemini)

**Status:** Done

## Backend

- `POST /api/ai/chat` — SSE stream, RAG via `content_embeddings`
- Env: `GEMINI_API_KEY`, optional pgvector

## Frontend

- `src/components/molecules/ai/ai-chat-widget.tsx`
- Terminal: `ask`, `ai`, `chat` commands
