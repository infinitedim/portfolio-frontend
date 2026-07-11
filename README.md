# Portfolio Frontend

This repository contains the Next.js frontend for the developer portfolio application. The frontend provides a standard web interface as well as an interactive terminal shell that connects to a separate Rust/Axum backend.

## Tech Stack

The frontend application is built using the following technologies:

- Next.js 16 (App Router, cacheComponents enabled, experimental typed environment variables, typed routes)
- React 19 (React Compiler enabled in production)
- TypeScript 6
- Tailwind CSS 4 (via `@tailwindcss/postcss`)
- Bun (runtime and package manager)
- Pino (structured logging)
- Radix UI (accessible primitive UI components)
- Framer Motion (animations)
- TipTap (WYSIWYG editor in the admin panel)
- Sandpack (interactive coding playground environment)
- Vitest (unit and integration tests)
- Playwright (end-to-end testing)

The application consumes data from a separate backend service, which runs a Rust/Axum REST and WebSocket API. By default, the frontend expects this API to be running on port 8080.

## Features

The portfolio frontend includes the following routes and interactive capabilities:

### Public Pages

- **Homepage (`/`)**: Standard portfolio landing page displaying an introduction, project highlights, and learning journey metrics.
- **Projects (`/projects`)**: A list of projects.
- **Blog (`/blog`, `/blog/[slug]`, `/blog/series/[slug]`)**: Static and dynamic blog views with server-side caching and Giscus comment integration.
- **Contact (`/contact`)**: Form for sending messages.
- **Roadmap (`/roadmap`)**: Visualization of learning progress based on roadmap.sh data.
- **Playground (`/playground`)**: A live coding playground using CodeSandbox Sandpack for code snippet execution.

### Gated Terminal (`/terminal`)

An interactive command-line experience. Access to `/terminal` is gated behind a series of puzzles located at `/gate` and `/gate/[level]`.

- **Command Parser**: Supports standard commands with typo tolerance, command history (using Arrow Up/Down keys), auto-completion (using Tab), and command flags/arguments.
- **Theme and Font Customization**: Interactive customization via command-line arguments (e.g., `theme dracula`, `font fira-code`).
- **Interactive Tour**: Guide/walkthrough for first-time visitors.
- **Progressive Web App (PWA)**: Support for offline mode, caching via service worker, and install prompts (triggered upon completion of the terminal tour).
- **Internationalization**: Support for multiple languages, including English and Indonesian, with a language selection command (`lang`).

### Administration and Security

- **Admin Panel (`/admin`)**: A dashboard for managing portfolio content (projects, blog posts, messages) using JWT-based auth with refresh token verification.
- **NATAS-style Puzzle Gate (`/s3cr3t/`, `/robots.txt`)**: Level 2 puzzle discovery endpoint proxying backend assets.
- **Edge Proxy (`src/proxy.ts`)**: Handles security headers (CSP, HSTS, CORS), gate redirections, and bypass mechanisms.

## Prerequisites

To run this project locally, ensure you have the following installed:

- Bun 1.2 or higher
- Node.js 22 or higher (for build compatibility)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/infinitedim/portfolio-frontend.git
cd portfolio-frontend
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure the values:

```bash
cp .env.example .env.development
```

Edit `.env.development` with your local configuration.

### 4. Start the Development Server

```bash
bun run dev
```

Navigate to `http://localhost:3000` to view the application. Note that for features like the terminal gate and admin auth to function, you must have the Rust backend running on the URL specified in your environment config (default: `http://localhost:8080`).

## Environment Variables

Configure the following variables in `.env.development` (local) or in your hosting provider's dashboard (production):

### Application and API Config

- `NEXT_PUBLIC_BASE_URL`: Base URL of the deployed site (used for Open Graph, sitemap, and canonical URLs). Default: `http://localhost:3000`.
- `SITE_URL`: Canonical base URL used by server-side referer validation checks. Default: `http://localhost:3000`.
- `BACKEND_URL`: Server-side API URL used by SSR/API route handlers to call the backend. Default: `http://localhost:8080`.
- `NEXT_PUBLIC_API_URL`: Browser-accessible backend API URL. Default: `http://localhost:8080`.
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for the proxy CORS check. Default: `http://localhost:3000`.

### Gate and Bypass

- `NEXT_PUBLIC_GATE_ENABLED`: Enable or disable the gate puzzle redirect. Default: `true`.
- `GATE_BYPASS_SECRET`: Server-only secret used to bypass the terminal gate. Send the `X-Gate-Bypass` header matching this value to skip redirects during development.

### Giscus Comments

- `NEXT_PUBLIC_GISCUS_REPO`: The target GitHub repository for comments (format: `owner/repo`).
- `NEXT_PUBLIC_GISCUS_REPO_ID`: The Giscus repository ID.
- `NEXT_PUBLIC_GISCUS_CATEGORY`: Default discussion category for comments.
- `NEXT_PUBLIC_GISCUS_CATEGORY_ID`: Default discussion category ID.
- Giscus also supports specific category IDs:
  - `NEXT_PUBLIC_GISCUS_CATEGORY_ID_ANNOUNCEMENTS`
  - `NEXT_PUBLIC_GISCUS_CATEGORY_ID_GENERAL`
  - `NEXT_PUBLIC_GISCUS_CATEGORY_ID_IDEAS`
  - `NEXT_PUBLIC_GISCUS_CATEGORY_ID_POLLS`
  - `NEXT_PUBLIC_GISCUS_CATEGORY_ID_QA`
  - `NEXT_PUBLIC_GISCUS_CATEGORY_ID_SHOW_AND_TELL`
  - `NEXT_PUBLIC_GISCUS_CATEGORY_ID_BLOG_COMMENTS`

### SEO Verification

- `GOOGLE_SITE_VERIFICATION`: Google Search Console verification token.
- `YANDEX_VERIFICATION`: Yandex Webmaster verification token.
- `BING_VERIFICATION`: Bing Webmaster verification token.

### Logging and Monitoring

- `NEXT_PUBLIC_LOG_API_URL`: Endpoint for client log ingestion. Default: `/api/logs`.
- `NEXT_PUBLIC_LOG_LEVEL`: Minimum level for client-side logging (`trace` | `debug` | `info` | `warn` | `error`). Default: `info`.
- `LOG_TO_FILE`: Set to `true` to enable server-side file-based logging.

### Integrations and Analytics

- `GH_USERNAME`: Default GitHub username for fetching profile stats in SSR data paths. Default: `exampleuser`.
- `NEXT_PUBLIC_GRAFANA_URL`: Grafana dashboard URL linked from the admin dashboard. Default: `http://localhost:3001`.
- `ANALYZE`: Set to `true` during a build to run the Next.js bundle analyzer.

### Test Environment

- `PLAYWRIGHT_BASE_URL`: Base URL for E2E integration tests.

## Available Scripts

Manage the project lifecycle using these scripts:

| Command                          | Action                                                            |
| -------------------------------- | ----------------------------------------------------------------- |
| `bun run dev`                    | Starts the development server with hot reloading                  |
| `bun run dev:clean`              | Deletes the `.next` cache and starts the dev server               |
| `bun run build`                  | Builds the application for production                             |
| `bun run start`                  | Starts the Next.js production server                              |
| `bun run lint`                   | Runs ESLint rules across the project                              |
| `bun run lint:fix`               | Runs ESLint and applies automatic code fixes                      |
| `bun run type-check`             | Runs the TypeScript compiler check (`tsc`) without emitting files |
| `bun run format`                 | Formats JavaScript, TypeScript, and Markdown files using Prettier |
| `bun run test`                   | Runs the Vitest unit/integration test suite once                  |
| `bun run test:watch`             | Runs Vitest in watch mode                                         |
| `bun run test:ui`                | Runs the interactive Vitest UI                                    |
| `bun run test:coverage`          | Runs unit tests with coverage reporting (v8 provider)             |
| `bun run test:e2e`               | Runs the Playwright E2E tests                                     |
| `bun run test:e2e:ui`            | Opens the Playwright UI mode for interactive E2E debugging        |
| `bun run clean`                  | Deletes the `.next` build folder and dependency caches            |
| `bun run perf:analyze`           | Analyzes bundle sizes using `@next/bundle-analyzer`               |
| `bun run perf:lighthouse`        | Runs desktop Core Web Vitals audits using Lighthouse CI           |
| `bun run perf:lighthouse:mobile` | Runs mobile Core Web Vitals audits using Lighthouse CI            |

## Testing

The frontend is covered by two distinct testing suites:

### Unit and Integration Tests (Vitest)

Unit and integration tests are located next to the components they test and run using Vitest.

```bash
bun run test
```

To run tests with code coverage:

```bash
bun run test:coverage
```

Thresholds are configured at 88% for lines, functions, branches, and statements in `vitest.config.ts`.

### End-to-End Tests (Playwright)

End-to-end tests are located in the `e2e` directory and use Playwright.

```bash
bun run test:e2e
```

For local interactive debugging, launch the E2E UI:

```bash
bun run test:e2e:ui
```

_Note: In the CI environment, Playwright automatically runs using a production build (`bun run build && bun run start`) and overrides `NEXT_PUBLIC_GATE_ENABLED=false` to test routes without gate restrictions._

## Deployment

Deploying the frontend application involves the following workflow:

### Production (Vercel)

The project is set up to automatically deploy to Vercel upon pushes to the `main` branch. This is configured via a GitHub Action CD pipeline in `.github/workflows/cd-production.yml` that triggers on successful completion of the CI pipeline.

To deploy manually via the Vercel CLI:

1. Install the Vercel CLI: `bun add -g vercel`
2. Link the project and deploy: `vercel`
3. Deploy to production: `vercel --prod`

Ensure all variables listed in the Environment Variables section are populated in your Vercel project settings.

## Contributing

1. Run checks locally before creating a pull request:
   ```bash
   bun run lint
   bun run type-check
   bun run test
   ```
2. Follow conventional commit messages (e.g., `feat:`, `fix:`, `docs:`, `chore:`).
3. Ensure any new features include unit or E2E tests where appropriate.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
