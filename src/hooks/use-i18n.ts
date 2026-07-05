import { useState, useEffect, useCallback, useMemo } from "react";
import { i18n, t, type TranslationKeys, getTranslationsForLocale } from "@/lib/i18n/i18n-service";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

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

  const translate = useCallback((key: keyof TranslationKeys): string => {
    if (!mounted) {
      return getTranslationsForLocale(DEFAULT_LOCALE)[key] ?? key;
    }
    return t(key);
  }, [mounted]);

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
    return i18n.getLocaleInfo(currentLocale);
  }, [currentLocale]);

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
