"use client";

import { useState, useEffect, type JSX } from "react";
import { useTheme } from "@/hooks/use-theme";
import { CustomizationService } from "@/lib/services/customization-service";
import type { CustomizationSettings } from "@/types/customization";
import { TerminalLoadingProgress } from "@/components/molecules/terminal/terminal-loading-progress";
import { Settings, Save, RotateCcw } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

export function SettingsManager(): JSX.Element {
  const { t } = useI18n();
  const { themeConfig, theme } = useTheme();

  const [settings, setSettings] = useState<CustomizationSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const customizationService = CustomizationService.getInstance();

  useEffect(() => {
    const currentSettings = customizationService.getSettings();
    setSettings(currentSettings);
  }, [customizationService]);

  const handleSettingChange = (
    key: keyof CustomizationSettings,
    value: CustomizationSettings[keyof CustomizationSettings],
  ) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);

    if (settings.autoSave) {
      customizationService.saveSettings({ [key]: value });
      setHasChanges(false);
    }
  };

  const handleSave = () => {
    if (!settings) return;

    customizationService.saveSettings(settings);
    setHasChanges(false);
  };

  const handleReset = () => {
    if (confirm(t("customResetConfirm"))) {
      customizationService.resetToDefaults();
      const defaultSettings = customizationService.getSettings();
      setSettings(defaultSettings);
      setHasChanges(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="w-full max-w-md">
          <TerminalLoadingProgress
            duration={1500}
            files={[
              "localStorage/settings.json",
              "src/types/customization.ts",
              "src/lib/services/customizationService.ts",
              "src/hooks/useTheme.ts",
              "src/components/customization/SettingsManager.tsx",
            ]}
            completionText={t("customSettingsLoaded")}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      key={`settings-manager-${theme}`}
      className="h-full flex flex-col"
    >
      {}
      <div
        className="p-4 border-b transition-colors duration-300"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3
              className="text-lg font-bold transition-colors duration-300 flex items-center gap-1.5"
              style={{ color: themeConfig.colors.accent }}
            >
              <Settings size={18} /> {t("customSettingsTitle")}
            </h3>
            <p
              className="text-sm opacity-75 transition-colors duration-300"
              style={{ color: themeConfig.colors.text }}
            >
              {t("customSettingsSubtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            {hasChanges && !settings.autoSave && (
              <button
                onClick={handleSave}
                className="px-3 py-1 text-sm rounded border hover:opacity-80 transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: `${themeConfig.colors.success || themeConfig.colors.accent}20`,
                  borderColor:
                    themeConfig.colors.success || themeConfig.colors.accent,
                  color:
                    themeConfig.colors.success || themeConfig.colors.accent,
                }}
              >
                <span className="flex items-center gap-1">
                  <Save size={14} /> {t("customSaveChanges")}
                </span>
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm rounded border hover:opacity-80 transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: `${themeConfig.colors.error || "#ff4444"}20`,
                borderColor: themeConfig.colors.error || "#ff4444",
                color: themeConfig.colors.error || "#ff4444",
              }}
            >
              <span className="flex items-center gap-1">
                <RotateCcw size={14} /> {t("customResetDefaults")}
              </span>
            </button>
          </div>
        </div>
      </div>

      {}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl space-y-6">
          {}
          <div>
            <h4
              className="font-medium mb-4 transition-colors duration-300"
              style={{ color: themeConfig.colors.text }}
            >
              {t("customGeneral")}
            </h4>
            <div className="space-y-4">
              {}
              <div className="flex items-center justify-between">
                <label
                  htmlFor="autoSaveCheckbox"
                  className="font-medium"
                  style={{ color: themeConfig.colors.text }}
                >
                  {t("customAutoSave")}
                </label>
                <input
                  type="checkbox"
                  id="autoSaveCheckbox"
                  checked={settings.autoSave}
                  onChange={(e) =>
                    handleSettingChange("autoSave", e.target.checked)
                  }
                />
              </div>
              {}
            </div>
          </div>

          {}
          <div>
            <h4
              className="font-medium mb-4"
              style={{ color: themeConfig.colors.text }}
            >
              {t("customTypographyDisplay")}
            </h4>
            <div className="space-y-4">
              {}
              <div>
                <label
                  htmlFor="fontSizeRange"
                  className="block font-medium mb-2"
                  style={{ color: themeConfig.colors.text }}
                >
                  {t("customFontSizeLabel").replace(
                    "{size}",
                    String(settings.fontSize),
                  )}
                </label>
                <input
                  type="range"
                  id="fontSizeRange"
                  min="12"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) =>
                    handleSettingChange(
                      "fontSize",
                      Number.parseInt(e.target.value),
                    )
                  }
                  className="w-full"
                />
              </div>
              {}
            </div>
          </div>

          {}
          <div>
            <h4
              className="font-medium mb-4"
              style={{ color: themeConfig.colors.text }}
            >
              {t("customLivePreview")}
            </h4>
            <div
              className="p-4 rounded border font-mono"
              style={{
                backgroundColor: `${themeConfig.colors.bg}80`,
                borderColor: themeConfig.colors.border,
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                letterSpacing: `${settings.letterSpacing}px`,
                color: themeConfig.colors.text,
              }}
            >
              <div
                style={{
                  color:
                    themeConfig.colors.success || themeConfig.colors.accent,
                }}
              >
                The quick brown fox jumps over the lazy dog.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
