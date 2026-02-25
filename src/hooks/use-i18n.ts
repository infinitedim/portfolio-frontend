import { useState, useEffect, useCallback, useMemo } from "react";
import { i18n, t, type TranslationKeys } from "@/lib/i18n/i18n-service";

export function useI18n() {
  const [currentLocale, setCurrentLocale] = useState(() => {
    try {
      return i18n?.getCurrentLocale() ?? "en";
    } catch {
      return "en";
    }
  });
  const [isRTL, setIsRTL] = useState(() => {
    try {
      return i18n?.isRTL() ?? false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const unsubscribe = i18n.subscribe((locale) => {
      setCurrentLocale(locale);
      setIsRTL(i18n.isRTL());
      i18n.updateDocumentDirection();
    });

    i18n.updateDocumentDirection();

    return unsubscribe;
  }, []);

  const translate = useCallback((key: keyof TranslationKeys): string => {
    return t(key);
  }, []);

  const translateWithFallback = useCallback(
    (key: keyof TranslationKeys, fallback?: string): string => {
      return i18n.tWithFallback(key, fallback);
    },
    [],
  );

  const changeLocale = useCallback((localeCode: string): boolean => {
    return i18n.setLocale(localeCode);
  }, []);

  const localeUtils = useMemo(
    () => ({
      getCurrentLocaleConfig: () => i18n.getCurrentLocaleConfig(),
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
    ...localeUtils,
    i18n,
  };
}
