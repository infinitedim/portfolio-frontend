"use client";

import type React from "react";

import { useState, JSX } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useFont } from "@/hooks/use-font";
import { CustomizationService } from "@/lib/services/customization-service";
import { Check } from "lucide-react";
import type { CustomFont } from "@/types/customization";
import type { FontName } from "@/types/font";
import { useI18n } from "@/hooks/use-i18n";
import { LenisScroll } from "@/components/layout/lenis-scroll";

interface FontManagerProps {
  fonts: CustomFont[];
  onUpdate: () => void;
  onClose?: () => void;
}

export function FontManager({
  fonts,
  onUpdate: _onUpdate,
  onClose,
}: FontManagerProps): JSX.Element {
  const { t } = useI18n();
  const { themeConfig } = useTheme();
  const { changeFont } = useFont();
  const [selectedFont, setSelectedFont] = useState<CustomFont | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFonts = fonts
    .filter((font) => {
      const matchesSearch =
        !searchQuery ||
        font.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        font.family.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleApplyFont = (font: CustomFont, closeDialog = true) => {
    if (font.source === "system") {
      changeFont(font.id as FontName);

      if (typeof window !== "undefined") {
        localStorage.setItem("terminal-font", font.id);
      }

      if (closeDialog) {
        onClose?.();
      }
    } else {
      const root = document.documentElement;
      root.style.setProperty("--terminal-font-family", font.family);
      root.style.setProperty("--terminal-font-weight", font.weight);
      root.style.setProperty(
        "--terminal-font-ligatures",
        font.ligatures ? "normal" : "none",
      );

      CustomizationService.getInstance().saveSettings({ currentFont: font.id });

      if (closeDialog) {
        onClose?.();
      }
    }
  };

  return (
    <div className="h-full flex">
      <div
        className="w-1/2 border-r"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div className="p-4 space-y-4">
          <div className="space-y-3">
            <input
              type="text"
              placeholder={t("customSearchFontsPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded border bg-transparent"
              style={{
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            />
          </div>

          <LenisScroll className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              {filteredFonts.map((font) => (
                <div
                  key={font.id}
                  className={`p-3 rounded border cursor-pointer transition-all ${selectedFont?.id === font.id ? "ring-2" : ""}`}
                  style={{
                    borderColor: themeConfig.colors.border,
                    backgroundColor:
                      selectedFont?.id === font.id
                        ? `${themeConfig.colors.accent}10`
                        : "transparent",
                    boxShadow:
                      selectedFont?.id === font.id
                        ? `0 0 0 2px ${themeConfig.colors.accent}`
                        : "none",
                  }}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setSelectedFont(font);
                  }}
                  tabIndex={0}
                  onClick={() => setSelectedFont(font)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className="font-medium"
                      style={{
                        color: themeConfig.colors.text,
                        fontFamily:
                          font.source === "custom" ? font.family : undefined,
                      }}
                    >
                      {font.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      {font.ligatures && (
                        <span
                          className="px-1 py-0.5 text-xs rounded"
                          style={{
                            backgroundColor: `${themeConfig.colors.accent}20`,
                            color: themeConfig.colors.accent,
                          }}
                          title="Supports ligatures"
                        >
                          ≡
                        </span>
                      )}
                      <span
                        className="px-2 py-1 text-xs rounded"
                        style={{
                          backgroundColor:
                            font.source === "system"
                              ? `${themeConfig.colors.prompt}20`
                              : font.source === "custom"
                                ? `${themeConfig.colors.accent}20`
                                : `${themeConfig.colors.success}20`,
                          color:
                            font.source === "system"
                              ? themeConfig.colors.prompt
                              : font.source === "custom"
                                ? themeConfig.colors.accent
                                : themeConfig.colors.success,
                        }}
                      >
                        {font.source}
                      </span>
                    </div>
                  </div>

                  <div
                    className="text-sm mb-2 font-mono"
                    style={{
                      fontFamily:
                        font.source === "custom" ? font.family : undefined,
                      color: themeConfig.colors.text,
                      opacity: 0.8,
                    }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyFont(font);
                      }}
                      className="px-2 py-1 text-xs rounded border hover:opacity-80"
                      style={{
                        backgroundColor: `${themeConfig.colors.success}20`,
                        borderColor: themeConfig.colors.success,
                        color: themeConfig.colors.success,
                      }}
                    >
                      {t("apply")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </LenisScroll>
        </div>
      </div>

      <div className="w-1/2">
        {selectedFont ? (
          <div className="h-full flex flex-col">
            <div
              className="p-4 border-b"
              style={{ borderColor: themeConfig.colors.border }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3
                    className="text-lg font-bold"
                    style={{ color: themeConfig.colors.accent }}
                  >
                    {selectedFont.name}
                  </h3>
                  <p className="text-sm opacity-75 font-mono">
                    {selectedFont.family}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApplyFont(selectedFont)}
                    className="px-3 py-1 text-sm rounded border hover:opacity-80"
                    style={{
                      backgroundColor: `${themeConfig.colors.success}20`,
                      borderColor: themeConfig.colors.success,
                      color: themeConfig.colors.success,
                    }}
                  >
                    <span className="flex items-center gap-1">
                      <Check size={14} /> {t("applyFont")}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex gap-4 text-xs opacity-75">
                <span>
                  {t("customSource").replace("{source}", selectedFont.source)}
                </span>
                <span>
                  {t("customWeight").replace(
                    "{weight}",
                    String(selectedFont.weight),
                  )}
                </span>
                <span>
                  {t("customLigaturesLabel").replace(
                    "{ligatures}",
                    selectedFont.ligatures ? t("yes") : t("no"),
                  )}
                </span>

                <span>
                  {t("customAdded").replace(
                    "{date}",
                    selectedFont.createdAt.toLocaleDateString(),
                  )}
                </span>
              </div>
            </div>

            <LenisScroll className="flex-1 overflow-y-auto">
              <div className="space-y-6 p-4">
                <div>
                  <h4
                    className="font-medium mb-3"
                    style={{ color: themeConfig.colors.text }}
                  >
                    {t("customFontPreview")}
                  </h4>
                  <div className="space-y-4">
                    {[12, 14, 16, 18, 20].map((size) => (
                      <div
                        key={size}
                        className="space-y-2"
                      >
                        <div className="text-xs opacity-75">{size}px</div>
                        <div
                          className="font-mono"
                          style={{
                            fontFamily: selectedFont.family,
                            fontSize: `${size}px`,
                            color: themeConfig.colors.text,
                          }}
                        >
                          The quick brown fox jumps over the lazy dog 0123456789
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4
                    className="font-medium mb-3"
                    style={{ color: themeConfig.colors.text }}
                  >
                    {t("customCodeSample")}
                  </h4>
                  <div
                    className="p-4 rounded border font-mono text-sm"
                    style={{
                      backgroundColor: `${themeConfig.colors.bg}80`,
                      borderColor: themeConfig.colors.border,
                      fontFamily: selectedFont.family,
                      color: themeConfig.colors.text,
                    }}
                  >
                    <div className="space-y-1">
                      <div>
                        <span style={{ color: themeConfig.colors.accent }}>
                          const
                        </span>{" "}
                        greeting ={" "}
                        <span style={{ color: themeConfig.colors.success }}>
                          "Hello World!"
                        </span>
                      </div>
                      <div>
                        <span style={{ color: themeConfig.colors.accent }}>
                          function
                        </span>{" "}
                        <span style={{ color: themeConfig.colors.prompt }}>
                          sayHello
                        </span>
                        () {"{"}
                      </div>
                      <div> return x &gt; x * 2</div>
                      <div>{"}"}</div>
                      <div></div>
                      <div>{"// Ligature test: != === => <= >= && ||"}</div>
                      <div>{"if (x !== y && a >= b) {"}</div>
                      <div> return x &gt; x * 2</div>
                      <div>{"}"}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4
                    className="font-medium mb-3"
                    style={{ color: themeConfig.colors.text }}
                  >
                    {t("customTerminalSample")}
                  </h4>
                  <div
                    className="p-4 rounded border font-mono text-sm"
                    style={{
                      backgroundColor: themeConfig.colors.bg,
                      borderColor: themeConfig.colors.border,
                      fontFamily: selectedFont.family,
                      color: themeConfig.colors.text,
                    }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span style={{ color: themeConfig.colors.prompt }}>
                          $
                        </span>
                        <span>npm install --save-dev typescript</span>
                      </div>
                      <div style={{ color: themeConfig.colors.success }}>
                        Package installed successfully
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: themeConfig.colors.prompt }}>
                          $
                        </span>
                        <span>git commit -m "Add TypeScript support"</span>
                      </div>
                      <div style={{ color: themeConfig.colors.accent }}>
                        [main 1a2b3c4] Add TypeScript support
                      </div>
                    </div>
                  </div>
                </div>

                {selectedFont.ligatures && (
                  <div>
                    <h4
                      className="font-medium mb-3"
                      style={{ color: themeConfig.colors.text }}
                    >
                      {t("customLigaturesTest")}
                    </h4>
                    <div
                      className="p-4 rounded border font-mono text-sm"
                      style={{
                        backgroundColor: `${themeConfig.colors.accent}10`,
                        borderColor: `${themeConfig.colors.accent}40`,
                        fontFamily: selectedFont.family,
                        color: themeConfig.colors.text,
                      }}
                    >
                      <div className="space-y-1">
                        <div>{"!= !== == === => <= >= => -> <- <->"}</div>
                        <div>{"&& || ?? ?. ??: ?:"}</div>
                        <div>{"++ -- += -= *= /= %= **="}</div>
                        <div>{"/* */ // <!-- -->"}</div>
                        <div>{"|> <| <> <$ $> <* *> <+ +>"}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </LenisScroll>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-4xl mb-4"></div>
              <h3
                className="text-lg font-medium mb-2"
                style={{ color: themeConfig.colors.accent }}
              >
                {t("customSelectFont")}
              </h3>
              <p className="text-sm opacity-75">
                {t("customChooseFontPreview")}
              </p>
              <div className="mt-4 text-xs opacity-60">
                <p>Choose any pre-installed system font to apply</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
