"use client";

import React, { useState } from "react";
import { ThemeConfig } from "@/types/theme";
import { getApiUrl } from "@/lib/api/get-api-url";
import { authService } from "@/lib/auth/auth-service";
import { Check, RefreshCw, ExternalLink, Globe, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

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

interface TranslationReviewProps {
  translated: BlogPostResponse;
  source: BlogPostResponse | null;
  onAction: () => void;
  themeConfig: ThemeConfig;
}

export function TranslationReview({
  translated,
  source,
  onAction,
  themeConfig,
}: TranslationReviewProps) {
  const router = useRouter();
  const [checks, setChecks] = useState({
    format: false,
    glossary: false,
    artifacts: false,
    length: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked = Object.values(checks).every(Boolean);

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
      onAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRetranslate = async () => {
    if (
      !confirm(
        "Are you sure you want to trigger a re-translation? This will overwrite the current draft.",
      )
    )
      return;
    try {
      setLoading(true);
      setError(null);
      const token = authService.getAccessToken();
      // Wait, is it id of translated or id of source?
      // The prompt says: POST /api/admin/blog/{id}/translate?target={locale}
      // Assuming {id} is the source post ID since we translate the source TO a target locale.
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
      onAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full border rounded-md overflow-hidden"
      style={{
        backgroundColor: themeConfig.colors.bg,
        borderColor: themeConfig.colors.border,
        color: themeConfig.colors.text,
      }}
    >
      {/* Header Bar */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div className="flex items-center gap-3">
          <Globe
            size={18}
            style={{ color: themeConfig.colors.accent }}
          />
          <span className="font-bold font-mono">
            Reviewing translation: {translated.slug}
          </span>
          <span
            className="px-2 py-0.5 text-xs rounded border font-mono uppercase"
            style={{
              borderColor: themeConfig.colors.accent,
              color: themeConfig.colors.accent,
            }}
          >
            {translated.locale}
          </span>
        </div>
        <div
          className="text-sm font-mono"
          style={{ color: themeConfig.colors.muted }}
        >
          Status: {translated.translationStatus}
        </div>
      </div>

      {/* Main Content Side-by-Side */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Left: Source */}
        <div
          className="flex flex-col border-b lg:border-b-0 lg:border-r overflow-hidden"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="p-3 border-b font-mono font-bold flex items-center gap-2 text-sm"
            style={{
              backgroundColor: `${themeConfig.colors.muted}20`,
              borderColor: themeConfig.colors.border,
            }}
          >
            <FileText size={16} /> Source (en)
          </div>
          <div className="p-4 overflow-y-auto font-mono text-sm space-y-4">
            {source ? (
              <>
                <div>
                  <div style={{ color: themeConfig.colors.muted }}>TITLE</div>
                  <div className="font-bold mt-1">{source.title}</div>
                </div>
                {source.summary && (
                  <div>
                    <div style={{ color: themeConfig.colors.muted }}>
                      SUMMARY
                    </div>
                    <div className="mt-1">{source.summary}</div>
                  </div>
                )}
                <div>
                  <div style={{ color: themeConfig.colors.muted }}>CONTENT</div>
                  <pre
                    className="mt-2 p-3 rounded overflow-x-auto whitespace-pre-wrap text-xs"
                    style={{
                      backgroundColor: `${themeConfig.colors.bg}80`,
                      borderColor: themeConfig.colors.border,
                      borderWidth: 1,
                    }}
                  >
                    {source.contentMd}
                  </pre>
                </div>
              </>
            ) : (
              <div style={{ color: themeConfig.colors.warning }}>
                Source not available.
              </div>
            )}
          </div>
        </div>

        {/* Right: Translated */}
        <div className="flex flex-col overflow-hidden">
          <div
            className="p-3 border-b font-mono font-bold flex items-center gap-2 text-sm"
            style={{
              backgroundColor: `${themeConfig.colors.accent}20`,
              borderColor: themeConfig.colors.border,
            }}
          >
            <FileText size={16} /> Translated ({translated.locale})
          </div>
          <div className="p-4 overflow-y-auto font-mono text-sm space-y-4">
            <div>
              <div style={{ color: themeConfig.colors.muted }}>TITLE</div>
              <div className="font-bold mt-1">{translated.title}</div>
            </div>
            {translated.summary && (
              <div>
                <div style={{ color: themeConfig.colors.muted }}>SUMMARY</div>
                <div className="mt-1">{translated.summary}</div>
              </div>
            )}
            <div>
              <div style={{ color: themeConfig.colors.muted }}>CONTENT</div>
              <pre
                className="mt-2 p-3 rounded overflow-x-auto whitespace-pre-wrap text-xs"
                style={{
                  backgroundColor: `${themeConfig.colors.bg}80`,
                  borderColor: themeConfig.colors.border,
                  borderWidth: 1,
                }}
              >
                {translated.contentMd}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div
        className="p-4 border-t font-mono text-sm"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div className="mb-4">
          <div className="font-bold mb-2">Pre-approval Checklist</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              {
                id: "format",
                label:
                  "Markdown formatting intact (headings, code blocks, lists, links)",
              },
              {
                id: "glossary",
                label:
                  "DNT glossary terms preserved (technical terms in English/as-is)",
              },
              { id: "artifacts", label: "No artifacts or placeholder text" },
              {
                id: "length",
                label: "Content length is reasonable (not truncated)",
              },
            ].map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2 cursor-pointer p-2 rounded border border-transparent hover:border-current transition-colors"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={checks[item.id as keyof typeof checks]}
                  onChange={(e) =>
                    setChecks({ ...checks, [item.id]: e.target.checked })
                  }
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div
            className="mb-4 p-2 border rounded"
            style={{
              borderColor: themeConfig.colors.error,
              color: themeConfig.colors.error,
            }}
          >
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleApprove}
            disabled={!allChecked || loading}
            className="flex items-center gap-2 px-4 py-2 font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: allChecked
                ? themeConfig.colors.success
                : themeConfig.colors.muted,
              color: themeConfig.colors.bg,
            }}
          >
            <Check size={16} /> [ Approve & Publish ]
          </button>
          <button
            onClick={handleRetranslate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 font-bold rounded border transition-colors hover:opacity-80 disabled:opacity-50"
            style={{
              borderColor: themeConfig.colors.warning,
              color: themeConfig.colors.warning,
            }}
          >
            <RefreshCw size={16} /> [ Re-translate ]
          </button>
          <button
            onClick={() => router.push(`/admin/blog?id=${translated.id}`)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 font-bold rounded border transition-colors hover:opacity-80 disabled:opacity-50 ml-auto"
            style={{
              borderColor: themeConfig.colors.border,
              color: themeConfig.colors.text,
            }}
          >
            <ExternalLink size={16} /> [ Edit Manually ]
          </button>
        </div>
      </div>
    </div>
  );
}
