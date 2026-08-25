import {
  DEFAULT_LOCALE,
  getFallbackLocale,
  getLocaleConfig,
  getSupportedLocales,
  isRegionalVariant,
  isValidLocale,
  LocaleConfig,
} from "./locales";
import { TranslationKeys } from "./interfaces";
import {
  de_DE_key,
  en_US_key,
  es_ES_key,
  fr_FR_key,
  id_ID_key,
  ja_JP_key,
  ko_KR_key,
  pt_BR_key,
  ru_RU_key,
  zh_CN_key,
} from "./dictionaries";

/**
 * Dictionary registry mapping locale codes to their respective translation key maps.
 */
const translations: Record<string, TranslationKeys> = {
  de_DE: de_DE_key,
  en_US: en_US_key,
  es_ES: es_ES_key,
  fr_FR: fr_FR_key,
  id_ID: id_ID_key,
  ja_JP: ja_JP_key,
  ko_KR: ko_KR_key,
  pt_BR: pt_BR_key,
  ru_RU: ru_RU_key,
  zh_CN: zh_CN_key,
} as const;

/**
 * Singleton service responsible for managing internationalization (i18n) state,
 * locale resolution, subscriber notifications, and string translations across the application.
 */
class I18nService {
  /** The singleton instance of the I18nService. */
  private static instance: I18nService;
  /** The currently active locale code. Defaults to `DEFAULT_LOCALE`. */
  private currentLocale: string = DEFAULT_LOCALE;
  /** Registered listener callbacks invoked upon locale changes. */
  private listeners: Set<(locale: string) => void> = new Set();

  /**
   * Initializes the i18n service and restores saved locale from localStorage if available in browser environment.
   */
  private constructor() {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const savedLocale = localStorage.getItem("portfolio_locale");
      if (savedLocale && isValidLocale(savedLocale)) {
        this.currentLocale = savedLocale;
      }
    }
  }

  /**
   * Retrieves the singleton instance of the I18nService.
   *
   * @returns {I18nService} The shared I18nService instance.
   */
  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  /**
   * Returns the currently active locale code (e.g., 'en_US', 'id_ID').
   *
   * @returns {string} The active locale code string.
   */
  public getCurrentLocale(): string {
    return this.currentLocale;
  }

  /**
   * Retrieves the full configuration object for the currently active locale.
   *
   * @returns {LocaleConfig | null} The active locale configuration or null if not found.
   */
  public getCurrentLocaleConfig(): LocaleConfig | null {
    return getLocaleConfig(this.currentLocale);
  }

  /**
   * Sets the active locale, handling regional variant fallbacks, persistence to localStorage,
   * and subscriber notification.
   *
   * @param {string} localeCode - The target locale code (e.g., 'en-US' or 'en_US').
   * @returns {boolean} True if the locale was valid and applied; false otherwise.
   */
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

  /**
   * Translates a given translation key for the currently active locale, falling back to default locale if missing.
   *
   * @param {keyof TranslationKeys} key - The translation key identifier.
   * @returns {string} The translated string or the key itself if no translation is found.
   */
  public t(key: keyof TranslationKeys): string {
    const locale = this.currentLocale;
    const translation = translations[locale] || translations[DEFAULT_LOCALE];
    return translation[key] || key;
  }

  /**
   * Translates a given translation key with an optional custom fallback string if translation is missing.
   *
   * @param {keyof TranslationKeys} key - The translation key identifier.
   * @param {string} [fallback] - Custom fallback string to use when key is not found.
   * @returns {string} The translated string or the specified fallback.
   */
  public tWithFallback(key: keyof TranslationKeys, fallback?: string): string {
    const translation = this.t(key);
    return translation !== key ? translation : fallback || key;
  }

  /**
   * Subscribes a listener callback to locale change events.
   *
   * @param {(locale: string) => void} listener - Callback function executed when locale changes.
   * @returns {() => void} Unsubscribe function to remove the listener.
   */
  public subscribe(listener: (locale: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Dispatches the updated locale to all registered subscriber callbacks.
   *
   * @returns {void}
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentLocale);
      } catch (error) {
        console.error("Error in i18n listener:", error);
      }
    });
  }

  /**
   * Retrieves all supported locale configurations supported by the application.
   *
   * @returns {LocaleConfig[]} Array of supported locale configurations.
   */
  public getSupportedLocales(): LocaleConfig[] {
    return getSupportedLocales();
  }

  /**
   * Checks whether a specific locale code is supported directly or as a recognized variant.
   *
   * @param {string} localeCode - The locale identifier to check.
   * @returns {boolean} True if the locale is recognized and supported; false otherwise.
   */
  public isLocaleSupported(localeCode: string): boolean {
    return isValidLocale(localeCode);
  }

  /**
   * Retrieves detailed configuration information for a given locale code.
   *
   * @param {string} localeCode - The locale identifier to look up.
   * @returns {LocaleConfig | null} The locale configuration object or null if invalid.
   */
  public getLocaleInfo(localeCode: string): LocaleConfig | null {
    return getLocaleConfig(localeCode);
  }

  /**
   * Determines whether the currently active locale requires right-to-left (RTL) text direction.
   *
   * @returns {boolean} True if the active locale is RTL; false otherwise.
   */
  public isRTL(): boolean {
    const config = this.getCurrentLocaleConfig();
    return config?.direction === "rtl";
  }

  /**
   * Computes the document text direction ("ltr" | "rtl") based on the current locale.
   *
   * @returns {"ltr" | "rtl"} The document text direction string.
   */
  public getDocumentDirection(): "ltr" | "rtl" {
    return this.isRTL() ? "rtl" : "ltr";
  }

  /**
   * Synchronizes the HTML document's `dir` and `lang` attributes with the active locale state.
   *
   * @returns {void}
   */
  public updateDocumentDirection(): void {
    if (typeof document !== "undefined") {
      document.documentElement.dir = this.getDocumentDirection();
      document.documentElement.lang = this.currentLocale.replace("_", "-");
    }
  }
}

/**
 * Singleton instance of the I18nService used across the frontend.
 */
const i18n = I18nService.getInstance();

/**
 * Retrieves the complete dictionary of translation keys for a specific locale code.
 *
 * @param {string} locale - The target locale code (e.g. 'en_US').
 * @returns {TranslationKeys} The translation key map for the given locale or default fallback.
 */
function getTranslationsForLocale(locale: string): TranslationKeys {
  return translations[locale] ?? translations[DEFAULT_LOCALE];
}

/**
 * Convenience helper function to translate a key using the singleton i18n instance.
 *
 * @param {keyof TranslationKeys} key - The translation key to resolve.
 * @returns {string} The translated string value.
 */
const t = (key: keyof TranslationKeys): string => i18n.t(key);

/**
 * Convenience helper function to translate a key with a custom fallback string.
 *
 * @param {keyof TranslationKeys} key - The translation key to resolve.
 * @param {string} [fallback] - The fallback string to use if the key is untranslated.
 * @returns {string} The resolved translation or fallback string.
 */
const tWithFallback = (key: keyof TranslationKeys, fallback?: string): string =>
  i18n.tWithFallback(key, fallback);

export {
  I18nService,
  i18n,
  t,
  getTranslationsForLocale,
  tWithFallback,
  DEFAULT_LOCALE,
  getFallbackLocale,
  getLocaleConfig,
  getSupportedLocales,
  isRegionalVariant,
  isValidLocale,
};
export type { TranslationKeys };

