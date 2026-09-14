import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { dictionaries } from "./i18n/dictionaries";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "bloodbridge-lang";

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (text: string) => string;
};

const I18nContext = createContext<I18nValue>({
  lang: "en",
  setLang: () => {},
  t: (text) => text,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) {
      setLangState(stored as Lang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (text: string) => {
      if (lang === "en") return text;
      return dictionaries[lang][text] ?? text;
    },
    [lang],
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

/** Shorthand: const t = useT(); t("Find a donor") */
export function useT() {
  return useContext(I18nContext).t;
}
