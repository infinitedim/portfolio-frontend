import type { Command, CommandOutput } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";
import { i18n, t } from "@/lib/i18n/i18n-service";
import {
  isRegionalVariant,
  getFallbackLocale,
  getLocaleConfig,
} from "@/lib/i18n/locales";

export const languageCommand: Command = {
  name: "lang",
  description: "Change application language",
  aliases: ["language", "locale"],
  category: "system",
  usage: "lang <locale_id>",
  async execute(args): Promise<CommandOutput> {
    const localeCode = args[0];

    if (!localeCode) {
      return showCurrentLanguage();
    }

    const normalizedCode = localeCode.replace("-", "_");
    const localeConfig = getLocaleConfig(normalizedCode);

    if (!localeConfig) {
      return {
        type: "error" as const,
        content: `${t("languageNotSupported")}: ${localeCode}`,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (isRegionalVariant(normalizedCode)) {
      const fallbackLocale = getFallbackLocale(normalizedCode);
      const fallbackConfig = getLocaleConfig(fallbackLocale);

      const fallbackMessage = [
        `🌍 ${t("languageFallback")} ${fallbackConfig?.name} (${fallbackLocale})`,
        "",
        `📝 ${localeCode} is a regional variant of ${fallbackLocale}`,
        `🎯 Using ${fallbackConfig?.nativeName} as the primary language`,
        "",
        "💡 Regional variants are automatically mapped to their primary language",
      ].join("\n");

      const success = i18n.setLocale(fallbackLocale);

      if (success) {
        return {
          type: "success" as const,
          content: fallbackMessage,
          timestamp: new Date(),
          id: generateId(),
        };
      }
    } else {
      const success = i18n.setLocale(normalizedCode);

      if (success) {
        const successMessage = [
          `✅ ${t("languageChanged")}`,
          "",
          `🌍 ${localeConfig.name} (${localeConfig.nativeName})`,
          `🏳️ ${localeConfig.flag}`,
          `📝 Code: ${localeConfig.code}`,
          `📏 Direction: ${localeConfig.direction.toUpperCase()}`,
          "",
          "💡 Language preference saved to localStorage",
        ].join("\n");

        return {
          type: "success" as const,
          content: successMessage,
          timestamp: new Date(),
          id: generateId(),
        };
      }
    }

    return {
      type: "error" as const,
      content: `Failed to change language to ${localeCode}`,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

function showCurrentLanguage() {
  const currentLocale = i18n.getCurrentLocale();
  const currentConfig = i18n.getCurrentLocaleConfig();
  const supportedLocales = i18n.getSupportedLocales();

  const currentLanguageInfo = [
    `🌍 ${t("currentLanguage")}`,
    "═".repeat(40),
    "",
    `🏳️ ${currentConfig?.flag} ${currentConfig?.name}`,
    `📝 ${currentConfig?.nativeName}`,
    `🔧 Code: ${currentConfig?.code}`,
    `📏 Direction: ${currentConfig?.direction.toUpperCase()}`,
    "",
    `📋 ${t("availableLanguages")}:`,
    ...supportedLocales.map((locale) => {
      const isCurrent = locale.code === currentLocale;
      const indicator = isCurrent ? "✅" : "  ";
      return `${indicator} ${locale.flag} ${locale.name} (${locale.code})`;
    }),
    "",
    "💡 Usage: lang <locale_id>",
    "💡 Examples: lang id_ID, lang es_ES, lang fr_FR",
    "",
    "🌐 Regional variants (e.g., en_GB, es_MX) will fall back to their primary language",
  ].join("\n");

  return {
    type: "info" as const,
    content: currentLanguageInfo,
    timestamp: new Date(),
    id: generateId(),
  };
}

export const languageListCommand: Command = {
  name: "langlist",
  description: "List all supported languages",
  aliases: ["languages", "locales"],
  category: "system",
  async execute(): Promise<CommandOutput> {
    const supportedLocales = i18n.getSupportedLocales();
    const currentLocale = i18n.getCurrentLocale();

    const languageList = [
      `🌍 ${t("availableLanguages")}`,
      "═".repeat(50),
      "",
      ...supportedLocales.map((locale, index) => {
        const isCurrent = locale.code === currentLocale;
        const indicator = isCurrent
          ? "✅"
          : `${(index + 1).toString().padStart(2)}.`;
        const currentMark = isCurrent ? " (Current)" : "";

        return `${indicator} ${locale.flag} ${locale.name}${currentMark}`;
      }),
      "",
      "📝 Regional Variants (fallback to primary language):",
      "   🇬🇧 en_GB → 🇺🇸 English (US)",
      "   🇨🇦 en_CA → 🇺🇸 English (US)",
      "   🇦🇺 en_AU → 🇺🇸 English (US)",
      "   🇲🇽 es_MX → 🇪🇸 Spanish",
      "   🇦🇷 es_AR → 🇪🇸 Spanish",
      "   🇨🇦 fr_CA → 🇫🇷 French",
      "   🇦🇹 de_AT → 🇩🇪 German",
      "   🇵🇹 pt_PT → 🇧🇷 Portuguese (Brazil)",
      "   🇹🇼 zh_TW → 🇨🇳 Chinese (Simplified)",
      "   🇪🇬 ar_EG → 🇸🇦 Arabic",
      "",
      "💡 Use 'lang <locale_id>' to change language",
      "💡 Example: lang id_ID, lang es_ES, lang en_GB",
    ].join("\n");

    return {
      type: "info" as const,
      content: languageList,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const languageInfoCommand: Command = {
  name: "langinfo",
  description: "Show detailed language information",
  aliases: ["localeinfo"],
  category: "system",
  usage: "langinfo [locale_id]",
  async execute(args): Promise<CommandOutput> {
    const localeCode = args[0];

    if (!localeCode) {
      const currentLocale = i18n.getCurrentLocale();
      const currentConfig = i18n.getCurrentLocaleConfig();

      const currentInfo = [
        `🌍 ${t("currentLanguage")} Information`,
        "═".repeat(50),
        "",
        `🏳️ Flag: ${currentConfig?.flag}`,
        `📝 Name: ${currentConfig?.name}`,
        `🌐 Native: ${currentConfig?.nativeName}`,
        `🔧 Code: ${currentConfig?.code}`,
        `📏 Direction: ${currentConfig?.direction.toUpperCase()}`,
        `💾 Saved: ${typeof window !== "undefined" ? "Yes" : "No"}`,
        `📍 Current: ${currentLocale}`,
        "",
        "💡 Use 'langinfo <locale_id>' to see info for other languages",
      ].join("\n");

      return {
        type: "info" as const,
        content: currentInfo,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const normalizedCode = localeCode.replace("-", "_");
    const localeConfig = getLocaleConfig(normalizedCode);

    if (!localeConfig) {
      return {
        type: "error" as const,
        content: `Language not found: ${localeCode}`,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const isCurrent = localeConfig.code === i18n.getCurrentLocale();
    const isRegional = isRegionalVariant(normalizedCode);
    const fallbackInfo = isRegional
      ? ` (falls back to ${getFallbackLocale(normalizedCode)})`
      : "";

    const languageInfo = [
      `🌍 Language Information: ${localeConfig.name}`,
      "═".repeat(50),
      "",
      `🏳️ Flag: ${localeConfig.flag}`,
      `📝 Name: ${localeConfig.name}`,
      `🌐 Native: ${localeConfig.nativeName}`,
      `🔧 Code: ${localeConfig.code}${fallbackInfo}`,
      `📏 Direction: ${localeConfig.direction.toUpperCase()}`,
      `📍 Status: ${isCurrent ? "Current" : "Available"}${isRegional ? " (Regional Variant)" : ""}`,
      "",
      isRegional
        ? "💡 This is a regional variant that falls back to its primary language"
        : "",
      isRegional
        ? "💡 Regional variants use the same translations as their primary language"
        : "",
      !isCurrent ? "💡 Use 'lang <locale_id>' to switch to this language" : "",
    ].join("\n");

    return {
      type: "info" as const,
      content: languageInfo,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};
