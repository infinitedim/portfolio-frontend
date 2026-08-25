/**
 * Configuration metadata describing an internationalization locale.
 */
export interface LocaleConfig {
  /** The standard locale identifier code (e.g., "en_US", "id_ID"). */
  code: string;
  /** English display name of the language/locale. */
  name: string;
  /** Endonym / native name of the language (e.g., "Bahasa Indonesia", "日本語"). */
  nativeName: string;
  /** Flag emoji representing the country or region associated with the locale. */
  flag: string;
  /** Text layout writing direction ("ltr" for left-to-right, "rtl" for right-to-left). */
  direction: "ltr" | "rtl";
  /** Optional fallback locale code to use when specific regional translations are missing. */
  fallback?: string;
}

/**
 * Key-value mapping of locale codes to their respective LocaleConfig definitions.
 */
export interface LocaleMapping {
  /** Map entry where key is a locale code string. */
  [key: string]: LocaleConfig;
}

/**
 * Primary supported application locales dictionary mapped by locale code.
 */
export const SUPPORTED_LOCALES: LocaleMapping = {
  en_US: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
  },

  id_ID: {
    code: "id_ID",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    flag: "🇮🇩",
    direction: "ltr",
  },
  es_ES: {
    code: "es_ES",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    direction: "ltr",
  },

  fr_FR: {
    code: "fr_FR",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    direction: "ltr",
  },

  de_DE: {
    code: "de_DE",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    direction: "ltr",
  },

  ja_JP: {
    code: "ja_JP",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    direction: "ltr",
  },

  ko_KR: {
    code: "ko_KR",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    direction: "ltr",
  },

  zh_CN: {
    code: "zh_CN",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    flag: "🇨🇳",
    direction: "ltr",
  },

  pt_BR: {
    code: "pt_BR",
    name: "Portuguese (Brazil)",
    nativeName: "Português (Brasil)",
    flag: "🇧🇷",
    direction: "ltr",
  },

  ru_RU: {
    code: "ru_RU",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    direction: "ltr",
  },
};

/**
 * Regional locale variations mapped to their closest supported primary locale fallbacks.
 */
export const REGIONAL_VARIANTS: LocaleMapping = {
  en_GB: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
    fallback: "en_US",
  },
  en_CA: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
    fallback: "en_US",
  },
  en_AU: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
    fallback: "en_US",
  },
  en_NZ: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
    fallback: "en_US",
  },
  en_IE: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
    fallback: "en_US",
  },
  en_IN: {
    code: "en_US",
    name: "English (US)",
    nativeName: "English (American)",
    flag: "🇺🇸",
    direction: "ltr",
    fallback: "en_US",
  },

  es_MX: {
    code: "es_ES",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    direction: "ltr",
    fallback: "es_ES",
  },
  es_AR: {
    code: "es_ES",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    direction: "ltr",
    fallback: "es_ES",
  },
  es_CO: {
    code: "es_ES",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    direction: "ltr",
    fallback: "es_ES",
  },

  fr_CA: {
    code: "fr_FR",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    direction: "ltr",
    fallback: "fr_FR",
  },
  fr_BE: {
    code: "fr_FR",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    direction: "ltr",
    fallback: "fr_FR",
  },

  de_AT: {
    code: "de_DE",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    direction: "ltr",
    fallback: "de_DE",
  },
  de_CH: {
    code: "de_DE",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    direction: "ltr",
    fallback: "de_DE",
  },

  pt_PT: {
    code: "pt_BR",
    name: "Portuguese (Brazil)",
    nativeName: "Português (Brasil)",
    flag: "🇧🇷",
    direction: "ltr",
    fallback: "pt_BR",
  },

  zh_TW: {
    code: "zh_CN",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    flag: "🇨🇳",
    direction: "ltr",
    fallback: "zh_CN",
  },
  zh_HK: {
    code: "zh_CN",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    flag: "🇨🇳",
    direction: "ltr",
    fallback: "zh_CN",
  },
};

/**
 * Combined dictionary of both primary supported locales and recognized regional variants.
 */
export const ALL_LOCALES = { ...SUPPORTED_LOCALES, ...REGIONAL_VARIANTS };

/**
 * Default fallback locale code for the application.
 */
export const DEFAULT_LOCALE = "en_US";

/**
 * Resolves a locale code into its complete LocaleConfig metadata object.
 *
 * @param {string} localeCode - The locale identifier to look up (supports hyphen or underscore).
 * @returns {LocaleConfig | null} The corresponding LocaleConfig or null if unrecognized.
 */
export function getLocaleConfig(localeCode: string): LocaleConfig | null {
  const normalizedCode = localeCode.replace("-", "_");
  return ALL_LOCALES[normalizedCode] || null;
}

/**
 * Checks whether the specified locale code is a recognized regional variant rather than a primary locale.
 *
 * @param {string} localeCode - The locale identifier to check.
 * @returns {boolean} True if the code matches a regional variant; false otherwise.
 */
export function isRegionalVariant(localeCode: string): boolean {
  const normalizedCode = localeCode.replace("-", "_");
  return !!REGIONAL_VARIANTS[normalizedCode];
}

/**
 * Computes the fallback locale code for a given regional variant or returns the normalized code itself.
 *
 * @param {string} localeCode - The locale identifier to resolve fallback for.
 * @returns {string} The resolved fallback locale code.
 */
export function getFallbackLocale(localeCode: string): string {
  const normalizedCode = localeCode.replace("-", "_");
  const config = REGIONAL_VARIANTS[normalizedCode];
  return config?.fallback || normalizedCode;
}

/**
 * Retrieves an array of all primary supported locale configurations.
 *
 * @returns {LocaleConfig[]} List of primary supported LocaleConfig objects.
 */
export function getSupportedLocales(): LocaleConfig[] {
  return Object.values(SUPPORTED_LOCALES);
}

/**
 * Validates whether a locale code is recognized by the application (either primary or variant).
 *
 * @param {string} localeCode - The locale identifier to validate.
 * @returns {boolean} True if the locale is recognized; false otherwise.
 */
export function isValidLocale(localeCode: string): boolean {
  const normalizedCode = localeCode.replace("-", "_");
  return !!ALL_LOCALES[normalizedCode];
}

/**
 * Represents locale metadata tailored for blog and article content localization.
 */
export interface BlogContentLocale {
  /** The ISO language or locale code (e.g., "en", "id", "zh_CN"). */
  code: string;
  /** Human-readable display label for the language. */
  label: string;
  /** Flag emoji representing the locale. */
  flag: string;
}

/**
 * List of all configured locales available for blog content translation.
 */
export const BLOG_CONTENT_LOCALES: BlogContentLocale[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "zh_CN", label: "Chinese (Simplified)", flag: "🇨🇳" },
  { code: "ja_JP", label: "Japanese", flag: "🇯🇵" },
  { code: "ko_KR", label: "Korean", flag: "🇰🇷" },
  { code: "es_ES", label: "Spanish", flag: "🇪🇸" },
  { code: "fr_FR", label: "French", flag: "🇫🇷" },
  { code: "de_DE", label: "German", flag: "🇩🇪" },
  { code: "pt_BR", label: "Portuguese (Brazil)", flag: "🇧🇷" },
  { code: "ru_RU", label: "Russian", flag: "🇷🇺" },
];

/**
 * Subset of blog locales with active, published article translations.
 */
export const PUBLISHED_CONTENT_LOCALES: BlogContentLocale[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
];

/**
 * Default fallback locale code for blog content.
 */
export const DEFAULT_BLOG_LOCALE = "en";

/**
 * Validates whether a given blog locale code is included in the available blog locales list.
 *
 * @param {string} code - The language/locale code to validate for blog content.
 * @returns {boolean} True if valid; false otherwise.
 */
export function isValidBlogLocale(code: string): boolean {
  return BLOG_CONTENT_LOCALES.some((locale) => locale.code === code);
}
