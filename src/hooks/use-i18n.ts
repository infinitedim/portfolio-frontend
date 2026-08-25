import { useState, useEffect, useCallback, useMemo } from "react";
import {
  i18n,
  t,
  type TranslationKeys,
  getTranslationsForLocale,
} from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

/**
 * Custom React hook for reactive internationalization (i18n), locale switching, and text translation.
 *
 * Automatically synchronizes with the singleton {@link i18n} manager, reacts to locale change
 * subscriptions, updates DOM document direction (`ltr`/`rtl`), and provides SSR-safe translation helpers.
 *
 * @returns An object containing the current localization state, translation functions, and locale utilities:
 * - `mounted`: Boolean indicating whether the client component has mounted.
 * - `currentLocale`: The active BCP 47 locale code (e.g., `'en'`, `'id'`, `'ja'`).
 * - `isRTL`: Boolean indicating if the current locale is right-to-left.
 * - `t`: Translates a given translation key into the active language string.
 * - `tWithFallback`: Translates a key with a provided fallback value if missing.
 * - `changeLocale`: Updates the active application locale. Returns `true` if successful.
 * - `getCurrentLocaleConfig`: Retrieves metadata for the currently active locale.
 * - `getSupportedLocales`: Returns the list of all supported locale configurations.
 * - `isLocaleSupported`: Checks if a given locale code is supported.
 * - `getLocaleInfo`: Retrieves configuration metadata for a specific locale code.
 * - `i18n`: The underlying i18n singleton instance.
 *
 * @example
 * ```tsx
 * const { t, currentLocale, changeLocale, isRTL } = useI18n();
 *
 * return (
 *   <div dir={isRTL ? 'rtl' : 'ltr'}>
 *     <h1>{t('terminal.welcome')}</h1>
 *     <button onClick={() => changeLocale('ja')}>日本語</button>
 *   </div>
 * );
 * ```
 */
export function useI18n() {
  const [mounted, setMounted] = useState(false);
  const [currentLocale, setCurrentLocale] = useState(DEFAULT_LOCALE);
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentLocale(i18n.getCurrentLocale());
    setIsRTL(i18n.isRTL());

    const unsubscribe = i18n.subscribe((locale) => {
      setCurrentLocale(locale);
      setIsRTL(i18n.isRTL());
      i18n.updateDocumentDirection();
    });

    i18n.updateDocumentDirection();

    return unsubscribe;
  }, []);

  const translate = useCallback(
    (key: keyof TranslationKeys): string => {
      if (!mounted) {
        return getTranslationsForLocale(DEFAULT_LOCALE)[key] ?? key;
      }
      return t(key);
    },
    [mounted],
  );

  const translateWithFallback = useCallback(
    (key: keyof TranslationKeys, fallback?: string): string => {
      if (!mounted) {
        const val = getTranslationsForLocale(DEFAULT_LOCALE)[key];
        return val !== undefined ? val : fallback || key;
      }
      return i18n.tWithFallback(key, fallback);
    },
    [mounted],
  );

  const changeLocale = useCallback((localeCode: string): boolean => {
    return i18n.setLocale(localeCode);
  }, []);

  const getCurrentLocaleConfig = useCallback(() => {
    if (!mounted) {
      return i18n.getLocaleInfo(DEFAULT_LOCALE);
    }
    return i18n.getLocaleInfo(currentLocale);
  }, [mounted, currentLocale]);

  const localeUtils = useMemo(
    () => ({
      getSupportedLocales: () => i18n.getSupportedLocales(),
      isLocaleSupported: (localeCode: string) =>
        i18n.isLocaleSupported(localeCode),
      getLocaleInfo: (localeCode: string) => i18n.getLocaleInfo(localeCode),
    }),
    [],
  );

  return {
    mounted,
    currentLocale,
    isRTL,
    t: translate,
    tWithFallback: translateWithFallback,
    changeLocale,
    getCurrentLocaleConfig,
    ...localeUtils,
    i18n,
  };
}
