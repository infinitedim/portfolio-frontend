"use client";

import { type JSX } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Props for the LanguageSwitcher component.
 */
interface LanguageSwitcherProps {
  /**
   * The visual layout variant: 'dropdown' for a compact Select menu or 'list' for horizontal button pills.
   * @defaultValue "dropdown"
   */
  variant?: "dropdown" | "list";
  /**
   * Optional CSS class names applied to the container element.
   * @defaultValue ""
   */
  className?: string;
  /**
   * Whether to render the native language name (e.g. 'Bahasa Indonesia') instead of English.
   * @defaultValue true
   */
  showNative?: boolean;
  /**
   * Whether to display country flag emojis next to the language name.
   * @defaultValue true
   */
  showFlags?: boolean;
  /**
   * Optional callback function triggered when the user switches to a new locale.
   *
   * @param locale - The newly selected locale code (e.g., 'en_US', 'id_ID').
   */
  onLanguageChange?: (locale: string) => void;
}

/**
 * LanguageSwitcher component allows users to switch the application locale.
 *
 * Supports both a dropdown menu variant and a listbox button group variant.
 * Synchronizes with the `useI18n` context and applies theme styling from `useTheme`.
 *
 * @param props - Component configuration properties.
 * @param props.variant - Visual display mode ('dropdown' | 'list').
 * @param props.className - Additional CSS classes.
 * @param props.showNative - Flag to show native language name.
 * @param props.showFlags - Flag to show flag emoji.
 * @param props.onLanguageChange - Optional change event handler.
 * @returns A JSX element rendering either the dropdown or button list language selector.
 */
export function LanguageSwitcher({
  variant = "dropdown",
  className = "",
  showNative = true,
  showFlags = true,
  onLanguageChange,
}: LanguageSwitcherProps): JSX.Element {
  const { themeConfig } = useTheme();
  const {
    mounted,
    currentLocale,
    changeLocale,
    getSupportedLocales,
    getCurrentLocaleConfig,
  } = useI18n();

  const supportedLocales = getSupportedLocales();
  const currentConfig = mounted
    ? getCurrentLocaleConfig()
    : supportedLocales.find((l) => l.code === "en_US") || null;

  /**
   * Handles locale switching via i18n hook and triggers the external onLanguageChange callback.
   *
   * @param localeCode - The target locale identifier code.
   */
  const handleLanguageChange = (localeCode: string) => {
    const success = changeLocale(localeCode);
    if (success) {
      onLanguageChange?.(localeCode);
    }
  };

  /**
   * Keyboard event handler for the list variant to activate selection on Enter or Space.
   *
   * @param event - The React keyboard event.
   * @param localeCode - The target locale code to activate.
   */
  const handleKeyDown = (event: React.KeyboardEvent, localeCode: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleLanguageChange(localeCode);
    }
  };

  if (variant === "list") {
    return (
      <div
        className={`flex flex-wrap gap-2 ${className}`}
        role="listbox"
        aria-label="Select language"
      >
        {supportedLocales.map((locale) => {
          const isSelected =
            locale.code === (mounted ? currentLocale : "en_US");
          return (
            <button
              key={locale.code}
              onClick={() => handleLanguageChange(locale.code)}
              onKeyDown={(e) => handleKeyDown(e, locale.code)}
              role="option"
              aria-selected={isSelected}
              className="px-3 py-1.5 rounded text-sm font-mono transition-colors duration-200 border"
              style={{
                backgroundColor: isSelected
                  ? themeConfig.colors.accent
                  : themeConfig.colors.bg,
                color: isSelected
                  ? themeConfig.colors.bg
                  : themeConfig.colors.text,
                borderColor: isSelected
                  ? themeConfig.colors.accent
                  : themeConfig.colors.border,
              }}
            >
              {showFlags && <span className="mr-1">{locale.flag}</span>}
              {showNative ? locale.nativeName : locale.name}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Select
        value={mounted ? currentLocale : "en_US"}
        onValueChange={handleLanguageChange}
      >
        <SelectTrigger
          className="w-fit min-w-30 h-8 px-3 py-1.5"
          aria-label={`Current language: ${currentConfig?.name}. Click to change.`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {supportedLocales.map((locale) => (
            <SelectItem
              key={locale.code}
              value={locale.code}
            >
              <div className="flex items-center gap-2">
                {showFlags && <span className="text-base">{locale.flag}</span>}
                <span className="flex-1 text-left truncate">
                  {showNative ? locale.nativeName : locale.name}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
