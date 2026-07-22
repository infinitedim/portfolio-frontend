"use client";

import { useState, type JSX } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomTheme } from "@/types/customization";
import { ThemeName } from "@/types/theme";
import { useI18n } from "@/hooks/use-i18n";
import { LenisScroll } from "@/components/layout/lenis-scroll";

interface ThemeManagerProps {
  themes: CustomTheme[];
  onUpdate: () => void;
  currentTheme?: ThemeName;
  onApplyTheme?: (themeId: string) => void;
}

export function ThemeManager({
  themes,
  onUpdate: _onUpdate,
  onApplyTheme,
  currentTheme,
}: ThemeManagerProps): JSX.Element {
  const { t } = useI18n();
  const { themeConfig, changeTheme, isThemeActive } = useTheme();
  const { isReducedMotion } = useAccessibility();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "created" | "modified">("name");

  const filteredThemes = themes
    .filter((theme) => {
      const matchesSearch =
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        theme.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = true;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "created":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "modified": {
          const aModified = a.modifiedAt || a.createdAt;
          const bModified = b.modifiedAt || b.createdAt;
          return bModified.getTime() - aModified.getTime();
        }
        default:
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
    });

  const handleApplyTheme = (themeId: string) => {
    console.log(`ThemeManager: Applying theme ${themeId}`);

    try {
      const success = changeTheme(themeId as ThemeName);

      if (success) {
        console.log(`Successfully applied theme: ${themeId}`);

        if (onApplyTheme) {
          onApplyTheme(themeId);
        }
      } else {
        console.error(`Failed to apply theme: ${themeId}`);
      }
    } catch (error) {
      console.error("Error in handleApplyTheme:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div
        className="p-4 border-b"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3
              className="text-lg font-semibold"
              style={{ color: themeConfig.colors.accent }}
            >
              {t("customThemeManagerTitle")}
            </h3>
            <p className="text-sm opacity-75">
              {t("customThemesCount")
                .replace("{count1}", String(filteredThemes.length))
                .replace("{count2}", String(themes.length))}
              {currentTheme &&
                t("customActiveTheme").replace("{theme}", currentTheme)}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder={t("customSearchThemesPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 rounded border text-sm transition-colors"
            style={{
              backgroundColor: `${themeConfig.colors.muted}20`,
              borderColor: themeConfig.colors.border,
              color: themeConfig.colors.text,
            }}
          />
          <div className="flex gap-2">
            <div className="relative inline-block w-full sm:w-auto">
              <Select
                value={sortBy}
                onValueChange={(value) =>
                  setSortBy(value as "name" | "created" | "modified")
                }
              >
                <SelectTrigger
                  className={`w-full sm:min-w-35 ${
                    !isReducedMotion ? "hover:scale-[1.02]" : ""
                  }`}
                >
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t("sortByName")}</SelectItem>
                  <SelectItem value="created">{t("sortByCreated")}</SelectItem>
                  <SelectItem value="modified">
                    {t("sortByModified")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <LenisScroll className="flex-1 overflow-auto">
        <div className="p-4">
          {filteredThemes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4"></div>
              <h3
                className="text-lg font-medium mb-2"
                style={{ color: themeConfig.colors.accent }}
              >
                {t("customNoThemesFound")}
              </h3>
              <p
                className="text-sm opacity-75"
                style={{ color: themeConfig.colors.text }}
              >
                {searchQuery
                  ? t("customAdjustSearchFilter")
                  : t("customNoThemesFound")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredThemes.map((theme) => {
                const isActive = isThemeActive(theme.id as ThemeName);

                const isActiveStyle = {
                  backgroundColor: isActive
                    ? `${themeConfig.colors.success || themeConfig.colors.accent}30`
                    : themeConfig.colors.accent,
                  color: isActive
                    ? themeConfig.colors.success || themeConfig.colors.accent
                    : themeConfig.colors.bg,
                };

                return (
                  <div
                    key={theme.id}
                    className="border rounded-lg p-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                    style={{
                      borderColor: isActive
                        ? themeConfig.colors.accent
                        : themeConfig.colors.border,
                      backgroundColor: isActive
                        ? `${themeConfig.colors.accent}10`
                        : "transparent",
                      boxShadow: isActive
                        ? `0 0 0 1px ${themeConfig.colors.accent}`
                        : "none",
                    }}
                  >
                    <div className="mb-3">
                      <div className="flex gap-1 mb-2">
                        {Object.entries(theme.colors)
                          .slice(0, 5)
                          .map(([key, color]) => (
                            <div
                              key={key}
                              className="w-6 h-6 rounded border"
                              style={{
                                backgroundColor: color,
                                borderColor: themeConfig.colors.border,
                              }}
                              title={`${key}: ${color}`}
                            />
                          ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className="font-medium truncate"
                          style={{ color: themeConfig.colors.text }}
                        >
                          {theme.name}
                        </h4>
                        <div className="flex items-center gap-1">
                          {isActive && (
                            <span
                              className="text-xs px-1 py-0.5 rounded"
                              style={{ color: themeConfig.colors.accent }}
                            >
                              ✓
                            </span>
                          )}
                          <span
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              backgroundColor: `${themeConfig.colors.muted}30`,
                              color: themeConfig.colors.muted,
                            }}
                          >
                            {theme.source}
                          </span>
                        </div>
                      </div>

                      {theme.description && (
                        <p
                          className="text-sm opacity-75 line-clamp-2"
                          style={{ color: themeConfig.colors.text }}
                        >
                          {theme.description}
                        </p>
                      )}

                      {(theme.createdAt || theme.modifiedAt) && (
                        <p
                          className="text-xs opacity-50 mt-1"
                          style={{ color: themeConfig.colors.text }}
                        >
                          {theme.modifiedAt
                            ? t("customModified").replace(
                                "{date}",
                                theme.modifiedAt.toLocaleDateString(),
                              )
                            : t("customCreated").replace(
                                "{date}",
                                theme.createdAt.toLocaleDateString(),
                              )}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApplyTheme(theme.id)}
                        className="flex-1 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 hover:scale-105"
                        style={isActiveStyle}
                        disabled={isActive}
                      >
                        {isActive ? t("customActive") : t("apply")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </LenisScroll>
    </div>
  );
}
