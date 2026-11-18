"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  DEFAULT_LOCALE,
  type Dictionary,
  getDictionary,
  isValidLocale,
  LANGUAGE_STORAGE_KEY,
  type Locale,
} from "@/i18n/config";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const LOCALE_CHANGE_EVENT = "schemeally:locale-change";

function subscribeToLocale(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", callback);
  window.addEventListener(LOCALE_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCALE_CHANGE_EVENT, callback);
  };
}

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function LanguageProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: LanguageProviderProps) {
  const getSnapshot = useCallback((): Locale => {
    try {
      const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isValidLocale(saved)) {
        return saved;
      }
    } catch {
      // Ignore storage access errors in restricted environments
    }
    return initialLocale;
  }, [initialLocale]);

  const getServerSnapshot = useCallback((): Locale => initialLocale, [initialLocale]);

  const locale = useSyncExternalStore(
    subscribeToLocale,
    getSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    if (!isValidLocale(nextLocale)) return;
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
      document.documentElement.lang = nextLocale;
      window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "ta" : "en");
  }, [locale, setLocale]);

  const dictionary = useMemo(() => getDictionary(locale), [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t: dictionary,
    }),
    [locale, setLocale, toggleLocale, dictionary]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
