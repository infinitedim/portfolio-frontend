import type { Command, CommandOutput } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";
import { i18n, t } from "@/lib/i18n";
import type { LocaleConfig } from "@/lib/i18n/locales";
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
        `${t("languageFallback")} ${fallbackConfig?.name} (${fallbackLocale})`,
        "",
        `${localeCode} is a regional variant of ${fallbackLocale}`,
        `Using ${fallbackConfig?.nativeName} as the primary language`,
        "",
        "Regional variants are automatically mapped to their primary language",
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
          `${t("languageChanged")}`,
          "",
          `${localeConfig.name} (${localeConfig.nativeName})`,
          `️ ${localeConfig.flag}`,
          `${t("termLangCode")}: ${localeConfig.code}`,
          `${t("termLangDirection")}: ${localeConfig.direction.toUpperCase()}`,
          "",
          t("termLangSaved"),
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
    `${t("currentLanguage")}`,
    "═".repeat(40),
    "",
    `  ${currentConfig?.flag} ${currentConfig?.name}`,
    `  ${currentConfig?.nativeName}`,
    `  ${t("termLangCode")}: ${currentConfig?.code}`,
    `  ${t("termLangDirection")}: ${currentConfig?.direction.toUpperCase()}`,
    "",
    `${t("availableLanguages")}:`,
    ...supportedLocales.map((locale: LocaleConfig) => {
      const isCurrent = locale.code === currentLocale;
      const prefix = isCurrent ? "  ► " : "    ";
      return `${prefix}${locale.flag} ${locale.name} (${locale.code})`;
    }),
    "",
    t("termLangUsage"),
    t("termLangExamples"),
    "",
    t("termLangRegionalNote"),
  ].join("\n");

  return {
    type: "info" as const,
    content: currentLanguageInfo,
    timestamp: new Date(),
    id: generateId(),
  };
}
