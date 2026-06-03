"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE, STORAGE_KEY, normalizeLanguage, t } from "./index";
import type { Language } from "./index";

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  // Initial load from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const normalized = normalizeLanguage(stored);
      setLanguageState(normalized);
    } catch {
      // ignore
    }
  }, []);

  // Persist + apply direction/lang
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore
    }

    const html = document.documentElement;
    html.lang = language;

    // RTL for Arabic only.
    if (language === "ar") {
      html.dir = "rtl";
    } else {
      html.dir = "ltr";
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const translate = useCallback(
    (key: string) => {
      return t(key, language);
    },
    [language]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      translate,
    }),
    [language, setLanguage, translate]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>.");
  return ctx;
}
