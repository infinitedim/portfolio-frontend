"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/molecules/admin/protected-route";
import { TerminalHeader } from "@/components/molecules/admin/terminal-header";
import { useTheme } from "@/hooks/use-theme";
import {
  PORTFOLIO_SECTIONS,
  listPortfolioVersions,
  restorePortfolioVersion,
  type PortfolioSection,
  type PortfolioVersionSummary,
} from "@/lib/services/portfolio-admin-service";
import { toast } from "sonner";

export default function AdminPortfolioPage() {
  const { themeConfig } = useTheme();
  const router = useRouter();
  const [section, setSection] = useState<PortfolioSection>("skills");
  const [versions, setVersions] = useState<PortfolioVersionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPortfolioVersions(section);
      setVersions(data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load versions",
      );
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    void loadVersions();
  }, [loadVersions]);

  const handleRestore = async (versionId: string) => {
    if (
      !confirm(
        "Restore this version? Current content will be snapshotted first.",
      )
    ) {
      return;
    }
    setRestoring(versionId);
    try {
      const result = await restorePortfolioVersion(versionId);
      toast.success(`Restored ${result.sectionKey} section`);
      await loadVersions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setRestoring(null);
    }
  };

  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
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
              className="mx-auto max-w-4xl rounded-lg border p-6"
              style={{ borderColor: themeConfig.colors.border }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{ color: themeConfig.colors.accent }}
                  >
                    Portfolio Version History
                  </h1>
                  <p className="text-sm opacity-70">
                    View and restore previous portfolio section snapshots
                  </p>
                </div>
                <Link
                  href="/admin"
                  className="text-sm font-mono opacity-70 hover:opacity-100"
                >
                  ← Dashboard
                </Link>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                {PORTFOLIO_SECTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSection(s)}
                    className="rounded border px-3 py-1.5 font-mono text-xs capitalize transition-colors"
                    style={{
                      borderColor:
                        section === s
                          ? themeConfig.colors.accent
                          : themeConfig.colors.border,
                      backgroundColor:
                        section === s
                          ? `${themeConfig.colors.accent}20`
                          : "transparent",
                      color:
                        section === s
                          ? themeConfig.colors.accent
                          : themeConfig.colors.text,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {loading ? (
                <p className="text-sm opacity-60">Loading versions…</p>
              ) : versions.length === 0 ? (
                <p className="text-sm opacity-60">
                  No version history for <strong>{section}</strong> yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between rounded border px-4 py-3"
                      style={{ borderColor: themeConfig.colors.border }}
                    >
                      <div>
                        <p className="font-mono text-sm">
                          {version.sectionKey}
                        </p>
                        <p className="text-xs opacity-60">
                          {new Date(version.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRestore(version.id)}
                        disabled={restoring === version.id}
                        className="rounded border px-3 py-1 font-mono text-xs transition-opacity disabled:opacity-50"
                        style={{
                          borderColor: themeConfig.colors.accent,
                          color: themeConfig.colors.accent,
                        }}
                      >
                        {restoring === version.id ? "Restoring…" : "Restore"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="mt-6 text-sm font-mono opacity-70 hover:opacity-100"
              >
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      </Suspense>
    </ProtectedRoute>
  );
}
