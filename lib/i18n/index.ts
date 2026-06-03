import { ar, type Language as Language } from "./ar";
import { en } from "./en";
import { fr } from "./fr";

export type { Language };

export const dictionaries: Record<Language, Record<string, string>> = {
  en,
  ar,
  fr,
};

export function t(key: string, lang: Language): string {
  const dict = dictionaries[lang] ?? dictionaries.en;
  return dict[key] ?? dictionaries.en[key] ?? key;
}

export const STORAGE_KEY = "mj-store:language";
export const DEFAULT_LANGUAGE: Language = "en";

export function normalizeLanguage(value: unknown): Language {
  if (value === "en" || value === "ar" || value === "fr") return value;
  return DEFAULT_LANGUAGE;
}
