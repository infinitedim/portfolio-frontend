import { DEFAULT_LOCALE, getFallbackLocale, getLocaleConfig, getSupportedLocales, isRegionalVariant, isValidLocale, LocaleConfig } from "./locales";
import { TranslationKeys } from "./interfaces";
import {
  ar_SA_key,
  de_DE_key,
  en_US_key,
  es_ES_key,
  fr_FR_key,
  hi_IN_key,
  id_ID_key,
  it_IT_key,
  ja_JP_key,
  ko_KR_key,
  nl_NL_key,
  pt_BR_key,
  ru_RU_key,
  th_TH_key,
  tr_TR_key,
  vi_VN_key,
  zh_CN_key,
} from "./dictionaries";

const translations: Record<string, TranslationKeys> = {
  ar_SA: ar_SA_key,
  de_DE: de_DE_key,
  en_US: en_US_key,
  es_ES: es_ES_key,
  fr_FR: fr_FR_key,
  hi_IN: hi_IN_key,
  id_ID: id_ID_key,
  it_IT: it_IT_key,
  ja_JP: ja_JP_key,
  ko_KR: ko_KR_key,
  nl_NL: nl_NL_key,
  pt_BR: pt_BR_key,
  ru_RU: ru_RU_key,
  th_TH: th_TH_key,
  tr_TR: tr_TR_key,
  vi_VN: vi_VN_key,
  zh_CN: zh_CN_key,
} as const;


class I18nService {
  private static instance: I18nService;
  private currentLocale: string = DEFAULT_LOCALE;
  private listeners: Set<(locale: string) => void> = new Set();

  private constructor() {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const savedLocale = localStorage.getItem("portfolio_locale");
      if (savedLocale && isValidLocale(savedLocale)) {
        this.currentLocale = savedLocale;
      }
    }
  }

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  public getCurrentLocale(): string {
    return this.currentLocale;
  }

  public getCurrentLocaleConfig(): LocaleConfig | null {
    return getLocaleConfig(this.currentLocale);
  }

  public setLocale(localeCode: string): boolean {
    const normalizedCode = localeCode.replace("-", "_");

    if (!isValidLocale(normalizedCode)) {
      return false;
    }

    if (isRegionalVariant(normalizedCode)) {
      const fallbackLocale = getFallbackLocale(normalizedCode);
      this.currentLocale = fallbackLocale;
    } else {
      this.currentLocale = normalizedCode;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("portfolio_locale", this.currentLocale);
    }

    this.notifyListeners();

    return true;
  }

  public t(key: keyof TranslationKeys): string {
    const locale = this.currentLocale;
    const translation = translations[locale] || translations[DEFAULT_LOCALE];
    return translation[key] || key;
  }

  public tWithFallback(key: keyof TranslationKeys, fallback?: string): string {
    const translation = this.t(key);
    return translation !== key ? translation : fallback || key;
  }

  public subscribe(listener: (locale: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentLocale);
      } catch (error) {
        console.error("Error in i18n listener:", error);
      }
    });
  }

  public getSupportedLocales(): LocaleConfig[] {
    return getSupportedLocales();
  }

  public isLocaleSupported(localeCode: string): boolean {
    return isValidLocale(localeCode);
  }

  public getLocaleInfo(localeCode: string): LocaleConfig | null {
    return getLocaleConfig(localeCode);
  }

  public isRTL(): boolean {
    const config = this.getCurrentLocaleConfig();
    return config?.direction === "rtl";
  }

  public getDocumentDirection(): "ltr" | "rtl" {
    return this.isRTL() ? "rtl" : "ltr";
  }

  public updateDocumentDirection(): void {
    if (typeof document !== "undefined") {
      document.documentElement.dir = this.getDocumentDirection();
      document.documentElement.lang = this.currentLocale;
    }
  }
}

const i18n = I18nService.getInstance();

function getTranslationsForLocale(locale: string): TranslationKeys {
  return translations[locale] ?? translations[DEFAULT_LOCALE];
}

const t = (key: keyof TranslationKeys): string => i18n.t(key);

const tWithFallback = (
  key: keyof TranslationKeys,
  fallback?: string,
): string => i18n.tWithFallback(key, fallback);


export { I18nService, i18n, t, getTranslationsForLocale, tWithFallback, DEFAULT_LOCALE, getFallbackLocale, getLocaleConfig, getSupportedLocales, isRegionalVariant, isValidLocale };
export type { TranslationKeys };