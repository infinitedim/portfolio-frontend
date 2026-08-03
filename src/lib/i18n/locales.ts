export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: "ltr" | "rtl";
  fallback?: string;
}

export interface LocaleMapping {
  [key: string]: LocaleConfig;
}

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

export const ALL_LOCALES = { ...SUPPORTED_LOCALES, ...REGIONAL_VARIANTS };

export const DEFAULT_LOCALE = "en_US";

export function getLocaleConfig(localeCode: string): LocaleConfig | null {
  const normalizedCode = localeCode.replace("-", "_");
  return ALL_LOCALES[normalizedCode] || null;
}

export function isRegionalVariant(localeCode: string): boolean {
  const normalizedCode = localeCode.replace("-", "_");
  return !!REGIONAL_VARIANTS[normalizedCode];
}

export function getFallbackLocale(localeCode: string): string {
  const normalizedCode = localeCode.replace("-", "_");
  const config = REGIONAL_VARIANTS[normalizedCode];
  return config?.fallback || normalizedCode;
}

export function getSupportedLocales(): LocaleConfig[] {
  return Object.values(SUPPORTED_LOCALES);
}

export function isValidLocale(localeCode: string): boolean {
  const normalizedCode = localeCode.replace("-", "_");
  return !!ALL_LOCALES[normalizedCode];
}

/** Blog post content locales (BCP-47 short codes, extensible). */
export interface BlogContentLocale {
  code: string;
  label: string;
  flag: string;
}

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
 * Active published content locales for Hreflang and Sitemap metadata.
 * Only include locales that ACTUALLY have published translated content in production
 * to prevent Googlebot hreflang return tag errors & duplicate content issues.
 */
export const PUBLISHED_CONTENT_LOCALES: BlogContentLocale[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
];

export const DEFAULT_BLOG_LOCALE = "en";

export function isValidBlogLocale(code: string): boolean {
  return BLOG_CONTENT_LOCALES.some((locale) => locale.code === code);
}
