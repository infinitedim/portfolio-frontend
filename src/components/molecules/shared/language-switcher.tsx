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

interface LanguageSwitcherProps {
  variant?: "dropdown" | "list";
  className?: string;
  showNative?: boolean;
  showFlags?: boolean;
  onLanguageChange?: (locale: string) => void;
}

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

  const handleLanguageChange = (localeCode: string) => {
    const success = changeLocale(localeCode);
    if (success) {
      onLanguageChange?.(localeCode);
    }
  };

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
              className="px-3 py-1.5 rounded text-sm font-mono transition-all duration-200 border"
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
          className="w-fit min-w-[120px] h-8 px-3 py-1.5"
          aria-label={`Current language: ${currentConfig?.name}. Click to change.`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {supportedLocales.map((locale) => (
            <SelectItem key={locale.code} value={locale.code}>
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

