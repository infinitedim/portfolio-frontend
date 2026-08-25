"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { FontName } from "@/types/font";
import { fonts, defaultFont } from "@/lib/fonts/font-config";

/**
 * Storage key used to persist the user's selected terminal font in `localStorage`.
 */
const STORAGE_KEY = "terminal-font" as const;

/**
 * Custom React hook for managing the terminal's active typography and font settings.
 *
 * Provides reactive font selection, dynamic CSS custom property injection on `:root`,
 * `localStorage` persistence, and window-level `font-change` custom event synchronization.
 *
 * @returns An object containing the current font state, configuration, and controls:
 * - `font`: The currently active {@link FontName}.
 * - `fontConfig`: The active {@link FontConfig} containing family, weight, and ligature details.
 * - `changeFont`: Callback function to switch to a different font and broadcast the update.
 * - `availableFonts`: List of all supported font keys.
 * - `mounted`: Boolean indicating whether the component has mounted on the client.
 *
 * @example
 * ```tsx
 * const { font, fontConfig, changeFont, availableFonts } = useFont();
 *
 * return (
 *   <select value={font} onChange={(e) => changeFont(e.target.value as FontName)}>
 *     {availableFonts.map((f) => (
 *       <option key={f} value={f}>{f}</option>
 *     ))}
 *   </select>
 * );
 * ```
 */
export function useFont() {
  const [font, setFont] = useState<FontName>(() => {
    if (typeof window === "undefined") return defaultFont;
    try {
      const savedFont = localStorage.getItem(STORAGE_KEY) as FontName;
      return savedFont && fonts[savedFont] ? savedFont : defaultFont;
    } catch {
      return defaultFont;
    }
  });

  const [mounted, setMounted] = useState(false);
  const isMountedRef = useRef(false);
  const appliedFontRef = useRef<FontName | null>(null);

  const availableFonts = useMemo(() => Object.keys(fonts) as FontName[], []);

  const fontConfig = useMemo(() => fonts[font] || fonts[defaultFont], [font]);

  useEffect(() => {
    setMounted(true);
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    if (appliedFontRef.current === font) return;

    try {
      localStorage.setItem(STORAGE_KEY, font);

      const currentFontConfig = fonts[font];
      if (!currentFontConfig) {
        console.warn(`Font configuration not found for: ${font}`);
        return;
      }

      const root = document.documentElement;
      root.style.setProperty(
        "--terminal-font-family",
        currentFontConfig.family,
      );
      root.style.setProperty(
        "--font-mono",
        currentFontConfig.family,
      );
      root.style.setProperty(
        "--terminal-font-weight",
        currentFontConfig.weight,
      );
      root.style.setProperty(
        "--terminal-font-ligatures",
        currentFontConfig.ligatures ? "normal" : "none",
      );

      const body = document.body;
      const newClassName =
        body.className.replace(/font-\w+/g, "").trim() + ` font-${font}`;
      body.className = newClassName.trim();

      appliedFontRef.current = font;
    } catch (error) {
      console.error("Failed to apply font:", error);
    }
  }, [font, mounted]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleFontChange = (e: Event) => {
      const customEvent = e as CustomEvent<FontName>;
      const newFont = customEvent.detail;
      if (newFont && fonts[newFont] && isMountedRef.current) {
        setFont((prev) => {
          if (prev === newFont) return prev;
          return newFont;
        });
      }
    };
    window.addEventListener("font-change", handleFontChange);
    return () => {
      window.removeEventListener("font-change", handleFontChange);
    };
  }, []);

  const changeFont = useCallback((newFont: FontName) => {
    if (!isMountedRef.current) return;

    if (!fonts[newFont]) {
      console.warn(`Font ${newFont} not found`);
      return;
    }

    setFont(newFont);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("font-change", { detail: newFont }));
    }
  }, []);

  return {
    font,
    fontConfig,
    changeFont,
    availableFonts,
    mounted,
  };
}
