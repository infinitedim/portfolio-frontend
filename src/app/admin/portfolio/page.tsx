"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/use-theme";
import {
  PORTFOLIO_SECTIONS,
  listPortfolioVersions,
  restorePortfolioVersion,
  type PortfolioSection,
  type PortfolioVersionSummary,
} from "@/lib/services/portfolio-admin-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/molecules/admin/confirm-dialog";
import { toast } from "sonner";
import { History, RotateCcw, ArrowLeft, Eye, Clock } from "lucide-react";

/**
 * Administrator portfolio version history and snapshot management page component.
 *
 * Enables administrators to switch between portfolio sections (e.g. skills, projects, experience),
 * inspect previous snapshot payloads in a slide-out drawer, and revert the live portfolio section state
 * back to any historical snapshot.
 *
 * @returns {React.JSX.Element} The rendered portfolio version management interface.
 */
export default function AdminPortfolioPage(): React.JSX.Element {
  const { themeConfig } = useTheme();
  const [section, setSection] = useState<PortfolioSection>("skills");
  const [versions, setVersions] = useState<PortfolioVersionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

                                    
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<PortfolioVersionSummary | null>(null);

  /**
   * Fetches the snapshot history list for the currently active portfolio section.
   *
   * @returns {Promise<void>} Resolves when version summaries have been loaded into state.
   */
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

  /**
   * Confirms and applies the reversion of the current section to the selected historical snapshot ID.
   *
   * @returns {Promise<void>} Resolves when the section is restored and versions are reloaded.
   */
  const handleRestoreConfirm = async (): Promise<void> => {
    if (!restoreConfirmId) return;
    setRestoring(restoreConfirmId);
    try {
      const result = await restorePortfolioVersion(restoreConfirmId);
      toast.success(`Restored ${result.sectionKey} section to current state`);
      setRestoreConfirmId(null);
      await loadVersions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-mono text-sm">
                        
      <div
        className="p-4 rounded-lg border flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-(--terminal-accent)/10 text-(--terminal-accent)">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-(--terminal-accent)">
              Portfolio Version History & Snapshots
            </h1>
            <p className="text-xs text-(--terminal-muted)">
              Inspect, preview, and restore previous section snapshots.
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" asChild className="h-8 gap-2 border-(--terminal-border)">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </div>

                          
      <div
        className="p-4 rounded-lg border space-y-4"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
      >
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Portfolio Sections">
          {PORTFOLIO_SECTIONS.map((s) => {
            const active = section === s;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSection(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono capitalize transition-colors ${
                  active
                    ? "bg-(--terminal-accent)/20 text-(--terminal-accent) border border-(--terminal-accent)/40 font-bold"
                    : "border border-(--terminal-border) text-(--terminal-muted) hover:text-(--terminal-text)"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

                            
        {loading ? (
          <div className="p-8 text-center text-xs text-(--terminal-muted) animate-pulse">
            Loading snapshots for section "{section}"...
          </div>
        ) : versions.length === 0 ? (
          <div className="p-12 text-center text-xs text-(--terminal-muted) border border-dashed rounded-lg">
            No version history snapshots found for <strong>{section}</strong> section yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {versions.map((version) => (
              <li
                key={version.id}
                className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-(--terminal-accent)/40"
                style={{
                  backgroundColor: themeConfig.colors.bg,
                  borderColor: themeConfig.colors.border,
                }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="terminal" className="text-[10px] uppercase">
                      {version.sectionKey}
                    </Badge>
                    <span className="text-xs text-(--terminal-text) font-semibold">
                      Snapshot ID: {version.id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="text-xs text-(--terminal-muted) flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(version.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewVersion(version)}
                    className="h-8 gap-1 border-(--terminal-border) text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview Payload
                  </Button>

                  <Button
                    variant="terminal"
                    size="sm"
                    onClick={() => setRestoreConfirmId(version.id)}
                    disabled={restoring === version.id}
                    className="h-8 gap-1 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {restoring === version.id ? "Restoring..." : "Restore Snapshot"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

                                    
      <Sheet open={Boolean(previewVersion)} onOpenChange={(open) => !open && setPreviewVersion(null)}>
        <SheetContent side="right" className="sm:max-w-xl font-mono text-xs overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Snapshot JSON Payload</SheetTitle>
            <SheetDescription>
              Snapshot ID: {previewVersion?.id} | Section: {previewVersion?.sectionKey}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <pre className="p-4 rounded bg-black/40 border border-(--terminal-border) text-[11px] text-(--terminal-text) overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(previewVersion, null, 2)}
            </pre>
          </div>
        </SheetContent>
      </Sheet>

                                    
      <ConfirmDialog
        open={Boolean(restoreConfirmId)}
        onOpenChange={(open) => !open && setRestoreConfirmId(null)}
        title="Restore Portfolio Snapshot"
        description="Are you sure you want to restore this version? The current section content will be automatically snapshotted first."
        confirmLabel="Restore Snapshot"
        variant="default"
        onConfirm={handleRestoreConfirm}
        isLoading={Boolean(restoring)}
      />
    </div>
  );
}
