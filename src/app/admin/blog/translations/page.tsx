"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { authService } from "@/lib/auth/auth-service";
import { getApiUrl } from "@/lib/api/get-api-url";
import {
  TranslationReview,
  BlogPostResponse,
} from "@/components/molecules/admin/translation-review";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Languages, Inbox } from "lucide-react";

/**
 * Data structure representing a pending blog post translation item queued for administrative review.
 *
 * @description
 * Pairs the machine-generated localized translation draft with its corresponding original
 * source blog post article for side-by-side comparison and verification.
 */
interface PendingTranslationItem {
  /** The auto-generated translation post data awaiting approval */
  translated: BlogPostResponse;
  /** The original source post from which the translation was generated, if available */
  source: BlogPostResponse | null;
}

/**
 * API response payload for pending blog translation items.
 */
interface PendingTranslationsResponse {
  /** Array of pending translation review items */
  items: PendingTranslationItem[];
  /** Total count of pending translations in the review queue */
  total: number;
}

/**
 * Administrator dashboard page for reviewing and approving AI-generated blog translations.
 *
 * @description
 * Displays a two-column interactive review workstation:
 * - Left column: Queue list of pending translations with locale badges and creation dates.
 * - Right column: Interactive {@link TranslationReview} workspace displaying the selected translation
 * alongside the source post for content approval, manual editing, or rejection.
 *
 * @returns {JSX.Element | null} The rendered translations queue management page or null before hydration.
 */
export default function TranslationsPage() {
  const { themeConfig, mounted } = useTheme();
  const [items, setItems] = useState<PendingTranslationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] =
    useState<PendingTranslationItem | null>(null);

  const fetchTranslations = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = authService.getAccessToken();
      const res = await fetch(
        `${getApiUrl()}/api/admin/blog/pending-translations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch pending translations: ${res.status}`);
      }
      const data: PendingTranslationsResponse = await res.json();
      setItems(data.items);
      setTotal(data.total);

      if (selectedItem) {
        const stillExists = data.items.find(
          (i) => i.translated.id === selectedItem.translated.id,
        );
        if (!stillExists) {
          setSelectedItem(null);
        } else {
          setSelectedItem(stillExists);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranslations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6 font-mono text-sm max-w-7xl mx-auto">
                        
      <div
        className="p-4 rounded-lg border flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-(--terminal-accent)/10 text-(--terminal-accent)">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-(--terminal-accent)">
              AI Translations Queue
            </h1>
            <p className="text-xs text-(--terminal-muted)">
              Review and approve auto-generated translations before publishing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="terminal" className="text-xs px-2.5 py-1">
            Pending Queue: {total}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTranslations}
            disabled={loading}
            className="gap-2 border-(--terminal-border)"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
                                
        <div
          className="flex flex-col border rounded-lg overflow-hidden lg:col-span-1"
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.border,
          }}
        >
          <div className="p-3 border-b font-bold text-xs text-(--terminal-muted) uppercase bg-(--terminal-accent)/5 flex items-center justify-between">
            <span>Translation Queue</span>
            <span>{items.length} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[600px]">
            {loading ? (
              <div className="text-center p-6 text-xs text-(--terminal-muted) animate-pulse">
                Loading pending queue...
              </div>
            ) : items.length === 0 ? (
              <div className="text-center p-8 text-xs text-(--terminal-muted) space-y-2">
                <Inbox className="h-8 w-8 mx-auto text-(--terminal-muted) opacity-50" />
                <p>No pending translations in queue.</p>
              </div>
            ) : (
              items.map((item) => {
                const isSelected = selectedItem?.translated.id === item.translated.id;
                return (
                  <button
                    key={item.translated.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left p-3 rounded-md border transition-colors flex flex-col gap-1.5 ${
                      isSelected
                        ? "border-(--terminal-accent) bg-(--terminal-accent)/15 text-(--terminal-accent)"
                        : "border-(--terminal-border) hover:border-(--terminal-accent)/40 hover:bg-(--terminal-accent)/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="terminal" className="uppercase text-[10px] px-1.5 py-0">
                        {item.translated.locale}
                      </Badge>
                      <span className="text-[10px] opacity-60">
                        {new Date(item.translated.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="font-bold text-xs truncate">
                      {item.translated.title}
                    </div>
                    <div className="text-[11px] truncate opacity-60">
                      slug: {item.translated.slug}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

                                                                           
        <div
          className="lg:col-span-2 min-h-[600px] border rounded-lg overflow-hidden flex flex-col"
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.border,
          }}
        >
          {selectedItem ? (
            <TranslationReview
              translated={selectedItem.translated}
              source={selectedItem.source}
              onAction={fetchTranslations}
              themeConfig={themeConfig}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-(--terminal-muted) space-y-2">
              <Languages className="h-10 w-10 text-(--terminal-muted) opacity-40" />
              <p>Select a pending translation from the queue to start reviewing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
