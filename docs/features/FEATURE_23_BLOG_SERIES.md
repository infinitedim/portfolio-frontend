# Feature #23 — Blog Series / Collections

**Status:** Done

## Backend

- Table `blog_series`; `series_id`, `series_order` on `blog_posts`
- Public: `GET /api/blog/series`, `GET /api/blog/series/:slug`, `?series=` filter
- Admin: CRUD `/api/admin/series`

## Frontend

- `/blog/series/[slug]`, series filter on blog list, picker in blog editor
