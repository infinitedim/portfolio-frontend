"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/molecules/admin/protected-route";
import { TerminalHeader } from "@/components/molecules/admin/terminal-header";
import { useTheme } from "@/hooks/use-theme";
import { getApiUrl } from "@/lib/api/get-api-url";

const CMS_ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/content/blog",
    description: "List published blog posts (optional ?locale=en&page=1&pageSize=20)",
    scope: "read",
  },
  {
    method: "GET",
    path: "/api/v1/content/blog/{slug}",
    description: "Get a published blog post by slug (?locale=en)",
    scope: "read",
  },
  {
    method: "GET",
    path: "/api/v1/content/portfolio",
    description: "Get all portfolio sections or ?section=skills",
    scope: "read",
  },
  {
    method: "PATCH",
    path: "/api/v1/content/blog/{slug}",
    description: "Update blog post fields (admin scope required)",
    scope: "admin",
  },
] as const;

export default function AdminCmsPage() {
  const { themeConfig } = useTheme();
  const apiUrl = getApiUrl();

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen flex flex-col"
        style={{
          backgroundColor: themeConfig.colors.bg,
          color: themeConfig.colors.text,
        }}
      >
        <TerminalHeader />

        <div className="flex-1 p-6">
          <div
            className="mx-auto max-w-4xl space-y-8 rounded-lg border p-6"
            style={{ borderColor: themeConfig.colors.border }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ color: themeConfig.colors.accent }}
                >
                  Headless CMS
                </h1>
                <p className="text-sm opacity-70">
                  API key docs and integration reference
                </p>
              </div>
              <Link
                href="/admin"
                className="text-sm font-mono opacity-70 hover:opacity-100"
              >
                ← Dashboard
              </Link>
            </div>

            <section
              className="rounded border p-4"
              style={{ borderColor: themeConfig.colors.border }}
            >
              <h2
                className="mb-2 text-lg font-semibold"
                style={{ color: themeConfig.colors.accent }}
              >
                Setup
              </h2>
              <p className="mb-3 text-sm opacity-80">
                Enable the headless CMS in the backend by setting{" "}
                <code className="rounded bg-black/30 px-1">HEADLESS_CMS_ENABLED=true</code>{" "}
                in <code className="rounded bg-black/30 px-1">portfolio-backend/.env</code>.
                All requests require the{" "}
                <code className="rounded bg-black/30 px-1">X-Api-Key</code> header.
              </p>
              <p className="text-sm opacity-80">
                API keys are stored hashed in the <code className="rounded bg-black/30 px-1">api_keys</code>{" "}
                table. Create keys via SQL (replace values):
              </p>
              <pre
                className="mt-3 overflow-x-auto rounded p-3 text-xs"
                style={{
                  backgroundColor: `${themeConfig.colors.border}20`,
                  border: `1px solid ${themeConfig.colors.border}`,
                }}
              >
{`INSERT INTO api_keys (name, key_hash, scope)
VALUES (
  'My CMS client',
  encode(digest('your-secret-key-here', 'sha256'), 'hex'),
  'read'  -- or 'admin' for write access
);`}
              </pre>
              <p className="mt-2 text-xs opacity-60">
                Scopes: <strong>read</strong> — GET endpoints only ·{" "}
                <strong>admin</strong> — includes PATCH blog updates
              </p>
            </section>

            <section>
              <h2
                className="mb-3 text-lg font-semibold"
                style={{ color: themeConfig.colors.accent }}
              >
                Endpoints
              </h2>
              <div className="space-y-3">
                {CMS_ENDPOINTS.map((ep) => (
                  <div
                    key={`${ep.method}-${ep.path}`}
                    className="rounded border p-4"
                    style={{ borderColor: themeConfig.colors.border }}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className="rounded px-2 py-0.5 font-mono text-xs"
                        style={{
                          backgroundColor: `${themeConfig.colors.accent}20`,
                          color: themeConfig.colors.accent,
                        }}
                      >
                        {ep.method}
                      </span>
                      <code className="text-sm">
                        {apiUrl}
                        {ep.path}
                      </code>
                      <span
                        className="rounded px-2 py-0.5 text-xs opacity-70"
                        style={{ border: `1px solid ${themeConfig.colors.border}` }}
                      >
                        scope: {ep.scope}
                      </span>
                    </div>
                    <p className="text-sm opacity-70">{ep.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section
              className="rounded border p-4"
              style={{ borderColor: themeConfig.colors.border }}
            >
              <h2
                className="mb-2 text-lg font-semibold"
                style={{ color: themeConfig.colors.accent }}
              >
                Example request
              </h2>
              <pre
                className="overflow-x-auto rounded p-3 text-xs"
                style={{
                  backgroundColor: `${themeConfig.colors.border}20`,
                  border: `1px solid ${themeConfig.colors.border}`,
                }}
              >
{`curl -H "X-Api-Key: your-secret-key-here" \\
  "${apiUrl}/api/v1/content/blog?locale=en&pageSize=5"`}
              </pre>
            </section>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
