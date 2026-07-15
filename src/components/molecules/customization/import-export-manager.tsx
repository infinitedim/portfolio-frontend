"use client";

import type React from "react";

import { useState, useRef, JSX } from "react";
import { useTheme } from "@/hooks/use-theme";
import { CustomizationService } from "@/lib/services/customization-service";
import { Zap, Info } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { LenisScroll } from "@/components/layout/lenis-scroll";

interface ImportExportManagerProps {
  onUpdate: () => void;
}

export function ImportExportManager({
  onUpdate,
}: ImportExportManagerProps): JSX.Element {
  const { t } = useI18n();
  const { themeConfig } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customizationService = CustomizationService.getInstance();

  const handleExportThemes = async () => {
    setIsExporting(true);
    try {
      const exportData = customizationService.exportThemes();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `terminal-themes-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert(t("customExportFailed"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportThemes = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await customizationService.importThemes(file);
      setImportResult(result);
      onUpdate();
    } catch (error) {
      console.error("Import failed:", error);
      setImportResult({
        success: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleExportSettings = () => {
    const settings = customizationService.getSettings();
    const themes = customizationService.getCustomThemes();
    const fonts = customizationService.getCustomFonts();

    const exportData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      settings,
      themes,
      fonts,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `terminal-customization-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const customThemes = customizationService.getCustomThemes();
  const customFonts = customizationService.getCustomFonts();

  return (
    <LenisScroll className="h-full overflow-y-auto">
      <div className="max-w-2xl space-y-6 p-4">
        <div>
          <h3
            className="text-lg font-bold mb-4"
            style={{ color: themeConfig.colors.accent }}
          >
            {t("customExportTitle")}
          </h3>
          <div className="space-y-4">
            <div
              className="p-4 rounded border"
              style={{
                backgroundColor: `${themeConfig.colors.success}10`,
                borderColor: `${themeConfig.colors.success}40`,
              }}
            >
              <h4
                className="font-medium mb-2"
                style={{ color: themeConfig.colors.success }}
              >
                {t("customExportThemes")}
              </h4>
              <p className="text-sm opacity-75 mb-3">
                {t("customExportThemesDesc")}
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span>
                    {t("customThemesAvailable").replace(
                      "{count}",
                      String(customThemes.length),
                    )}
                  </span>
                </div>
                <button
                  onClick={handleExportThemes}
                  disabled={isExporting || customThemes.length === 0}
                  className="px-4 py-2 rounded border hover:opacity-80 disabled:opacity-50"
                  style={{
                    backgroundColor: `${themeConfig.colors.success}20`,
                    borderColor: themeConfig.colors.success,
                    color: themeConfig.colors.success,
                  }}
                >
                  {isExporting ? t("exporting") : t("customExportThemesBtn")}
                </button>
              </div>
            </div>

            <div
              className="p-4 rounded border"
              style={{
                backgroundColor: `${themeConfig.colors.accent}10`,
                borderColor: `${themeConfig.colors.accent}40`,
              }}
            >
              <h4
                className="font-medium mb-2"
                style={{ color: themeConfig.colors.accent }}
              >
                {t("customExportBackup")}
              </h4>
              <p className="text-sm opacity-75 mb-3">
                {t("customExportBackupDesc")}
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm space-y-1">
                  <div>
                    {t("customThemesCountLabel").replace(
                      "{count}",
                      String(customThemes.length),
                    )}
                  </div>
                  <div>
                    {t("customFontsCountLabel").replace(
                      "{count}",
                      String(customFonts.length),
                    )}
                  </div>
                  <div>{t("customSettingsPreferences")}</div>
                </div>
                <button
                  onClick={handleExportSettings}
                  className="px-4 py-2 rounded border hover:opacity-80"
                  style={{
                    backgroundColor: `${themeConfig.colors.accent}20`,
                    borderColor: themeConfig.colors.accent,
                    color: themeConfig.colors.accent,
                  }}
                >
                  {t("customExportAllBtn")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3
            className="text-lg font-bold mb-4"
            style={{ color: themeConfig.colors.accent }}
          >
            {t("customImportTitle")}
          </h3>
          <div className="space-y-4">
            <div
              className="p-4 rounded border"
              style={{
                backgroundColor: `${themeConfig.colors.prompt}10`,
                borderColor: `${themeConfig.colors.prompt}40`,
              }}
            >
              <h4
                className="font-medium mb-2"
                style={{ color: themeConfig.colors.prompt }}
              >
                {t("customImportThemes")}
              </h4>
              <p className="text-sm opacity-75 mb-3">
                {t("customImportThemesDesc")}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="px-4 py-2 rounded border hover:opacity-80 disabled:opacity-50"
                  style={{
                    backgroundColor: `${themeConfig.colors.prompt}20`,
                    borderColor: themeConfig.colors.prompt,
                    color: themeConfig.colors.prompt,
                  }}
                >
                  {isImporting ? t("importing") : t("customChooseFileBtn")}
                </button>
                <span className="text-sm opacity-75">
                  {t("customSupportsJson")}
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportThemes}
                className="hidden"
              />

              {importResult && (
                <div
                  className="mt-4 p-3 rounded border"
                  style={{
                    backgroundColor:
                      importResult.errors.length > 0
                        ? `${themeConfig.colors.error}10`
                        : `${themeConfig.colors.success}10`,
                    borderColor:
                      importResult.errors.length > 0
                        ? `${themeConfig.colors.error}40`
                        : `${themeConfig.colors.success}40`,
                  }}
                >
                  <div className="text-sm space-y-1">
                    <div
                      style={{
                        color:
                          importResult.errors.length > 0
                            ? themeConfig.colors.error
                            : themeConfig.colors.success,
                      }}
                    >
                      {importResult.success > 0 &&
                        t("customImportSuccess").replace(
                          "{count}",
                          String(importResult.success),
                        )}
                      {importResult.errors.length > 0 &&
                        t("customImportErrors").replace(
                          "{count}",
                          String(importResult.errors.length),
                        )}
                    </div>
                    {importResult.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs opacity-75">
                          {t("customShowErrors")}
                        </summary>
                        <div className="mt-1 text-xs space-y-1">
                          {importResult.errors.map((error, index) => (
                            <div
                              key={index}
                              className="opacity-75"
                            >
                              • {error}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3
            className="text-lg font-bold mb-4"
            style={{ color: themeConfig.colors.accent }}
          >
            <span className="flex items-center gap-1.5">
              <Zap size={18} /> {t("customQuickActionsTitle")}
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                if (confirm(t("customResetAllConfirm"))) {
                  customizationService.resetToDefaults();
                  onUpdate();
                }
              }}
              className="p-4 rounded border text-left hover:opacity-80"
              style={{
                backgroundColor: `${themeConfig.colors.error}10`,
                borderColor: `${themeConfig.colors.error}40`,
                color: themeConfig.colors.text,
              }}
            >
              <div
                className="font-medium mb-1"
                style={{ color: themeConfig.colors.error }}
              >
                {t("customResetAllBtn")}
              </div>
              <div className="text-sm opacity-75">
                {t("customResetAllDesc")}
              </div>
            </button>

            <button
              onClick={() => {
                const data = {
                  themes: customThemes.length,
                  fonts: customFonts.length,
                  storageUsed: JSON.stringify({
                    themes: customThemes,
                    fonts: customFonts,
                    settings: customizationService.getSettings(),
                  }).length,
                };
                alert(
                  t("customStorageAlert")
                    .replace("{themes}", String(data.themes))
                    .replace("{fonts}", String(data.fonts))
                    .replace(
                      "{storage}",
                      String(Math.round(data.storageUsed / 1024)),
                    ),
                );
              }}
              className="p-4 rounded border text-left hover:opacity-80"
              style={{
                backgroundColor: `${themeConfig.colors.accent}10`,
                borderColor: `${themeConfig.colors.accent}40`,
                color: themeConfig.colors.text,
              }}
            >
              <div
                className="font-medium mb-1"
                style={{ color: themeConfig.colors.accent }}
              >
                {t("customStorageInfoBtn")}
              </div>
              <div className="text-sm opacity-75">
                {t("customStorageInfoDesc")}
              </div>
            </button>
          </div>
        </div>

        <div
          className="p-4 rounded border"
          style={{
            backgroundColor: `${themeConfig.colors.accent}10`,
            borderColor: `${themeConfig.colors.accent}40`,
          }}
        >
          <h4
            className="font-medium mb-2"
            style={{ color: themeConfig.colors.accent }}
          >
            <span className="flex items-center gap-1.5">
              <Info size={16} /> {t("customTipsTitle")}
            </span>
          </h4>
          <div className="text-sm space-y-2 opacity-75">
            <div>• {t("customTip1")}</div>
            <div>• {t("customTip2")}</div>
            <div>• {t("customTip3")}</div>
            <div>• {t("customTip4")}</div>
            <div>• {t("customTip5")}</div>
          </div>
        </div>
      </div>
    </LenisScroll>
  );
}
