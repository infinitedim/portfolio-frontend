"use client";

import React, { useState } from "react";
import { ThemeConfig } from "@/types/theme";
import { getApiUrl } from "@/lib/api/get-api-url";
import { authService } from "@/lib/auth/auth-service";
import { Check, RefreshCw, Globe, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "./confirm-dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Data transfer object representing a blog post entity from the backend API.
 *
 * @interface BlogPostResponse
 * @property {string} id - Unique identifier for the blog post.
 * @property {string} title - Title of the blog post.
 * @property {string} slug - URL-friendly slug.
 * @property {string | null} summary - Short synopsis or excerpt.
 * @property {string | null} contentMd - Raw Markdown body content.
 * @property {string | null} contentHtml - Rendered and sanitized HTML content.
 * @property {boolean} published - Whether the post is currently published.
 * @property {string[]} tags - Associated topic tags.
 * @property {number} readingTimeMinutes - Estimated reading time in minutes.
 * @property {number} viewCount - Total accumulated page views.
 * @property {string | null} publishAt - Scheduled or actual publication ISO timestamp.
 * @property {"draft" | "scheduled" | "published"} status - Publication workflow state.
 * @property {string} locale - Locale code (e.g. 'en', 'id').
 * @property {string | null} seriesId - Optional ID of the parent blog series.
 * @property {number | null} seriesOrder - Position order within the parent series.
 * @property {string | null} translationGroupId - Shared UUID linking translated versions of the same article.
 * @property {string} translationStatus - Status of translation workflow (e.g. 'pending', 'translated', 'approved').
 * @property {string | null} reviewedAt - ISO timestamp when the translation was reviewed.
 * @property {string | null} reviewedBy - Identifier of the reviewer user.
 * @property {string} createdAt - ISO timestamp when the post was created.
 * @property {string} updatedAt - ISO timestamp when the post was last modified.
 */
export interface BlogPostResponse {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  contentMd: string | null;
  contentHtml: string | null;
  published: boolean;
  tags: string[];
  readingTimeMinutes: number;
  viewCount: number;
  publishAt: string | null;
  status: "draft" | "scheduled" | "published";
  locale: string;
  seriesId: string | null;
  seriesOrder: number | null;
  translationGroupId: string | null;
  translationStatus: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Properties for the TranslationReview component.
 *
 * @interface TranslationReviewProps
 * @property {BlogPostResponse} translated - The target localized blog post under review.
 * @property {BlogPostResponse | null} source - The original source language blog post for side-by-side comparison.
 * @property {() => void} onAction - Callback invoked when an action (approve, re-translate) completes to refresh parent state.
 * @property {ThemeConfig} themeConfig - Current terminal theme styling tokens.
 */
interface TranslationReviewProps {
  translated: BlogPostResponse;
  source: BlogPostResponse | null;
  onAction: () => void;
  themeConfig: ThemeConfig;
}

/**
 * Side-by-side translation review and verification interface for administrators.
 *
 * Displays original source content alongside machine-translated copy, provides a 4-point safety checklist
 * (Markdown formatting, glossary preservation, artifact absence, length sanity), and allows one-click approval
 * or re-translation triggering.
 *
 * @param {TranslationReviewProps} props - Component properties.
 * @param {BlogPostResponse} props.translated - The translated blog post entity.
 * @param {BlogPostResponse | null} props.source - The original source blog post entity.
 * @param {() => void} props.onAction - State refresh callback after review actions.
 * @param {ThemeConfig} props.themeConfig - Active terminal theme configuration.
 * @returns {React.JSX.Element} The rendered translation review workspace.
 */
export function TranslationReview({
  translated,
  source,
  onAction,
  themeConfig,
}: TranslationReviewProps): React.JSX.Element {
  const router = useRouter();
  const [checks, setChecks] = useState({
    format: false,
    glossary: false,
    artifacts: false,
    length: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retranslateDialogOpen, setRetranslateDialogOpen] = useState(false);

  const allChecked = Object.values(checks).every(Boolean);

  /**
   * Approves and publishes the translated blog post via backend API.
   *
   * @returns {Promise<void>}
   */
  const handleApprove = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = authService.getAccessToken();
      const res = await fetch(
        `${getApiUrl()}/api/admin/blog/${translated.id}/approve-translation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );
      if (!res.ok) {
        throw new Error(`Failed to approve: ${res.status}`);
      }
      toast.success("Translation approved & published");
      onAction();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Triggers an asynchronous re-translation of the article from source content.
   *
   * @returns {Promise<void>}
   */
  const handleRetranslate = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = authService.getAccessToken();
      const sourceId = source ? source.id : translated.id;
      const res = await fetch(
        `${getApiUrl()}/api/admin/blog/${sourceId}/translate?target=${translated.locale}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );
      if (!res.ok) {
        throw new Error(`Failed to re-translate: ${res.status}`);
      }
      toast.success("Re-translation triggered successfully");
      onAction();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full border rounded-lg overflow-hidden font-mono text-sm"
      style={{
        borderColor: themeConfig.colors.border,
        backgroundColor: themeConfig.colors.bg,
      }}
    >
                    
      <div
        className="p-4 border-b flex flex-wrap items-center justify-between gap-4"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-(--terminal-accent)" />
            <h2 className="font-bold text-base text-(--terminal-accent)">
              Review Translation: {translated.title}
            </h2>
          </div>
          <p className="text-xs text-(--terminal-muted)">
            Target Locale: <span className="uppercase text-(--terminal-text)">{translated.locale}</span> | Status:{" "}
            <span className="uppercase text-amber-400 font-semibold">{translated.translationStatus}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRetranslateDialogOpen(true)}
            disabled={loading}
            className="text-xs gap-1 border-(--terminal-border)"
          >
            <RefreshCw className="h-3 w-3" /> Re-translate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/blog`)}
            className="text-xs gap-1 border-(--terminal-border)"
          >
            <FileText className="h-3 w-3" /> Edit in Post Editor
          </Button>
        </div>
      </div>

                               
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-(--terminal-border) min-h-[400px]">
                             
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-(--terminal-border)">
            <span className="font-bold text-xs text-(--terminal-muted) uppercase">
              Original Source ({source?.locale ?? "en"})
            </span>
            <span className="text-xs text-(--terminal-muted)">{source?.title}</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-(--terminal-muted) block mb-1">Title:</span>
              <div className="font-semibold p-2 rounded bg-(--terminal-accent)/5 border border-(--terminal-border)">
                {source?.title ?? "N/A"}
              </div>
            </div>

            <div>
              <span className="text-(--terminal-muted) block mb-1">Summary:</span>
              <div className="p-2 rounded bg-(--terminal-accent)/5 border border-(--terminal-border)">
                {source?.summary ?? "N/A"}
              </div>
            </div>

            <div>
              <span className="text-(--terminal-muted) block mb-1">Markdown Content:</span>
              <pre className="p-3 rounded bg-black/30 border border-(--terminal-border) font-mono text-[11px] whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {source?.contentMd ?? "N/A"}
              </pre>
            </div>
          </div>
        </div>

                                        
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-(--terminal-border)">
            <span className="font-bold text-xs text-(--terminal-accent) uppercase">
              AI Translation ({translated.locale})
            </span>
            <span className="text-xs text-(--terminal-accent)">{translated.title}</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-(--terminal-muted) block mb-1">Translated Title:</span>
              <div className="font-semibold p-2 rounded bg-(--terminal-accent)/10 border border-(--terminal-accent)/30 text-(--terminal-accent)">
                {translated.title}
              </div>
            </div>

            <div>
              <span className="text-(--terminal-muted) block mb-1">Translated Summary:</span>
              <div className="p-2 rounded bg-(--terminal-accent)/10 border border-(--terminal-accent)/30">
                {translated.summary ?? "N/A"}
              </div>
            </div>

            <div>
              <span className="text-(--terminal-muted) block mb-1">Translated Markdown Content:</span>
              <pre className="p-3 rounded bg-black/30 border border-(--terminal-accent)/30 font-mono text-[11px] whitespace-pre-wrap max-h-[300px] overflow-y-auto text-(--terminal-text)">
                {translated.contentMd ?? "N/A"}
              </pre>
            </div>
          </div>
        </div>
      </div>

                                    
      <div className="p-4 border-t border-(--terminal-border) space-y-4 bg-(--terminal-bg)">
        <h3 className="font-bold text-xs text-(--terminal-accent) uppercase">
          Pre-Approval Safety Checklist
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {[
            {
              id: "format",
              label: "Markdown formatting intact (headings, code blocks, lists, links)",
            },
            {
              id: "glossary",
              label: "DNT glossary terms preserved (technical terms in English/as-is)",
            },
            { id: "artifacts", label: "No AI artifacts or placeholder text" },
            {
              id: "length",
              label: "Content length is reasonable (not truncated)",
            },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2.5 cursor-pointer p-2 rounded border border-(--terminal-border) hover:border-(--terminal-accent)/40 transition-colors"
            >
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-(--terminal-border) text-(--terminal-accent) focus:ring-(--terminal-accent) bg-transparent accent-(--terminal-accent)"
                checked={checks[item.id as keyof typeof checks]}
                onChange={(e) =>
                  setChecks({ ...checks, [item.id]: e.target.checked })
                }
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        {error && (
          <div className="p-3 border rounded text-xs border-red-500/40 bg-red-500/10 text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="terminal"
            onClick={handleApprove}
            disabled={!allChecked || loading}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            {loading ? "Approving..." : "[ Approve & Publish Translation ]"}
          </Button>

          {!allChecked && (
            <span className="text-xs text-amber-400">
              ⚠️ Check all 4 safety criteria before publishing.
            </span>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={retranslateDialogOpen}
        onOpenChange={setRetranslateDialogOpen}
        title="Trigger Re-Translation"
        description="Are you sure you want to re-translate this article? This will overwrite the current translated draft."
        confirmLabel="Re-Translate"
        variant="destructive"
        onConfirm={handleRetranslate}
        isLoading={loading}
      />
    </div>
  );
}
