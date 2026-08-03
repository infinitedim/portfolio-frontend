"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/molecules/admin/protected-route";
import { useTheme } from "@/hooks/use-theme";
import { TerminalHeader } from "@/components/molecules/admin/terminal-header";
import { authService } from "@/lib/auth/auth-service";
import { getApiUrl } from "@/lib/api/get-api-url";
import {
  TranslationReview,
  BlogPostResponse,
} from "@/components/molecules/admin/translation-review";

interface PendingTranslationItem {
  translated: BlogPostResponse;
  source: BlogPostResponse | null;
}

interface PendingTranslationsResponse {
  items: PendingTranslationItem[];
  total: number;
}

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

      // Clear selected item if it no longer exists in the fetched list
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
    <ProtectedRoute>
      <div
        className="min-h-screen flex flex-col p-4 md:p-8 font-mono"
        style={{
          backgroundColor: themeConfig.colors.bg,
          color: themeConfig.colors.text,
        }}
      >
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-4">
          <TerminalHeader themeConfig={themeConfig} />

          <div
            className="flex items-center justify-between p-2 rounded border text-sm"
            style={{
              borderColor: themeConfig.colors.border,
              backgroundColor: `${themeConfig.colors.muted}10`,
            }}
          >
            <span>
              Pending Translations:{" "}
              <strong style={{ color: themeConfig.colors.accent }}>
                {total}
              </strong>
            </span>
            <button
              onClick={fetchTranslations}
              className="px-2 py-1 border rounded hover:opacity-80 transition-opacity"
              style={{ borderColor: themeConfig.colors.border }}
            >
              [ Refresh ]
            </button>
          </div>

          {error && (
            <div
              className="p-4 rounded border text-sm"
              style={{
                borderColor: themeConfig.colors.error,
                color: themeConfig.colors.error,
                backgroundColor: `${themeConfig.colors.error}10`,
              }}
            >
              {error}
            </div>
          )}

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* List panel */}
            <div
              className="flex flex-col border rounded-md overflow-hidden lg:col-span-1"
              style={{ borderColor: themeConfig.colors.border }}
            >
              <div
                className="p-3 border-b font-bold"
                style={{
                  borderColor: themeConfig.colors.border,
                  backgroundColor: `${themeConfig.colors.muted}20`,
                }}
              >
                Queue
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {loading ? (
                  <div className="text-center p-4 text-sm opacity-70 animate-pulse">
                    Loading...
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center p-4 text-sm opacity-70">
                    No pending translations.
                  </div>
                ) : (
                  items.map((item) => (
                    <button
                      key={item.translated.id}
                      onClick={() => setSelectedItem(item)}
                      className="w-full text-left p-3 rounded border transition-colors flex flex-col gap-2"
                      style={{
                        borderColor:
                          selectedItem?.translated.id === item.translated.id
                            ? themeConfig.colors.accent
                            : themeConfig.colors.border,
                        backgroundColor:
                          selectedItem?.translated.id === item.translated.id
                            ? `${themeConfig.colors.accent}10`
                            : "transparent",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="px-1.5 py-0.5 text-xs rounded border font-mono uppercase"
                          style={{
                            borderColor: themeConfig.colors.accent,
                            color: themeConfig.colors.accent,
                          }}
                        >
                          {item.translated.locale}
                        </span>
                        <span className="text-xs opacity-60">
                          {new Date(
                            item.translated.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div
                        className="font-bold truncate"
                        title={item.translated.title}
                      >
                        {item.translated.title}
                      </div>
                      <div
                        className="text-xs truncate opacity-70"
                        title={item.translated.slug}
                      >
                        {item.translated.slug}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Review panel */}
            <div
              className="lg:col-span-2 h-200 lg:h-auto border rounded-md"
              style={{ borderColor: themeConfig.colors.border }}
            >
              {selectedItem ? (
                <TranslationReview
                  translated={selectedItem.translated}
                  source={selectedItem.source}
                  onAction={fetchTranslations}
                  themeConfig={themeConfig}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm opacity-50">
                  Select a translation from the queue to review.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
