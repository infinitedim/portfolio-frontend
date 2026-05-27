# Feature #25 — Multi-language Blog Content

**Status:** Done (en + id, extensible)

## Backend

- `locale`, `translation_group_id` on `blog_posts`; unique `(slug, locale)`
- `?locale=` on public list/get; admin translation link API

## Frontend

- `src/lib/i18n/locales.ts` — `BLOG_CONTENT_LOCALES`
- Locale switcher on blog pages; locale field in blog editor
