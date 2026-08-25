"use client";

import type { JSX } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTheme } from "@/hooks/use-theme";
import { useFont } from "@/hooks/use-font";
import { useI18n } from "@/hooks/use-i18n";
import { themes } from "@/lib/themes/theme-config";
import { fonts } from "@/lib/fonts/font-config";
import type { ThemeName } from "@/types/theme";
import type { FontName } from "@/types/font";
import { LenisScroll } from "@/components/layout/lenis-scroll";

interface RootCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RootCustomizationModal({
  isOpen,
  onClose,
}: RootCustomizationModalProps): JSX.Element {
  const { t } = useI18n();
  const { theme: currentTheme, changeTheme, availableThemes } = useTheme();
  const { font: currentFont, changeFont, availableFonts } = useFont();

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md animate-fade-in" />
        <Dialog.Content
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-emerald-500/30 bg-neutral-900/95 p-5 sm:p-6 font-mono shadow-2xl backdrop-blur-md max-h-[85vh] flex flex-col focus:outline-none overflow-hidden"
        >
                               
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <Dialog.Title className="text-sm sm:text-base font-bold text-white tracking-tight">
                <span className="text-emerald-400">$</span> root.config --ui
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </Dialog.Close>
          </div>

                                                                
          <LenisScroll className="flex-1 overflow-y-auto pr-1">
            <div className="space-y-6 py-1">
              <Dialog.Description className="text-xs text-neutral-400 leading-relaxed">
                Root Superuser Access unlocked. Customize site-wide theme palette &
                monospaced typography settings below.
              </Dialog.Description>

                                            
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase tracking-wider">
                  <span>// {t("navSelectTheme")}</span>
                  <span className="text-[10px] text-neutral-500">
                    [{availableThemes.length} AVAILABLE]
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {availableThemes.map((themeName) => {
                    const config = themes[themeName];
                    const isActive = currentTheme === themeName;
                    return (
                      <button
                        key={themeName}
                        onClick={() => changeTheme(themeName as ThemeName)}
                        className={`min-h-11 rounded-lg border p-2.5 text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isActive
                            ? "border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/10"
                            : "border-neutral-800 bg-neutral-950/70 hover:border-neutral-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-white capitalize truncate">
                            {config?.name || themeName}
                          </span>
                          {themeName === "default" && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 shrink-0">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <span
                            className="h-3 w-3 rounded-full border border-white/20"
                            style={{
                              backgroundColor: config?.colors?.bg || "#000",
                            }}
                          />
                          <span
                            className="h-3 w-3 rounded-full border border-white/20"
                            style={{
                              backgroundColor: config?.colors?.accent || "#00ff41",
                            }}
                          />
                          <span
                            className="h-3 w-3 rounded-full border border-white/20"
                            style={{
                              backgroundColor: config?.colors?.text || "#fff",
                            }}
                          />
                          {isActive && (
                            <span className="ml-auto text-[10px] text-emerald-400 font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

                                           
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase tracking-wider">
                  <span>// {t("navSelectFont")}</span>
                  <span className="text-[10px] text-neutral-500">
                    [{availableFonts.length} FONTS]
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableFonts.map((fontId) => {
                    const fontConfig = fonts[fontId as FontName];
                    const isActive = currentFont === fontId;
                    return (
                      <button
                        key={fontId}
                        onClick={() => changeFont(fontId as FontName)}
                        className={`min-h-11 rounded-lg border px-3 py-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                          isActive
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                            : "border-neutral-800 bg-neutral-950/70 text-neutral-300 hover:border-neutral-700"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">
                            {fontConfig?.name || fontId}
                          </span>
                          <span
                            className="text-[10px] text-neutral-500 truncate"
                            style={{ fontFamily: fontConfig?.family }}
                          >
                            const code = 1337;
                          </span>
                        </div>
                        {isActive && <span className="text-xs font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </LenisScroll>

                               
          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
              * Click Save to apply &amp; hard refresh page
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Dialog.Close asChild>
                <button className="min-h-11 px-3.5 py-2 rounded bg-neutral-800/80 hover:bg-neutral-800 text-xs text-neutral-300 transition-colors cursor-pointer">
                  Close
                </button>
              </Dialog.Close>
              <button
                onClick={() => {
                  onClose();
                  if (typeof window !== "undefined") {
                    window.location.reload();
                  }
                }}
                className="min-h-11 px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-xs text-black font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <span>💾 Save &amp; Reload</span>
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
