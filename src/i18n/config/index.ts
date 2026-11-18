import enDictionary from "@/i18n/dictionaries/en.json";
import taDictionary from "@/i18n/dictionaries/ta.json";

export type Locale = "en" | "ta";

export type Dictionary = typeof enDictionary;

export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "ta"] as const;

export const DEFAULT_LOCALE: Locale = "en";

export const LANGUAGE_STORAGE_KEY = "schemeally_locale";

const dictionaries: Record<Locale, Dictionary> = {
  en: enDictionary,
  ta: taDictionary,
};

export function isValidLocale(value: unknown): value is Locale {
  return value === "en" || value === "ta";
}

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[isValidLocale(locale) ? locale : DEFAULT_LOCALE];
}
