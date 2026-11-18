import { describe, expect, it } from "vitest";
import enDictionary from "@/i18n/dictionaries/en.json";
import taDictionary from "@/i18n/dictionaries/ta.json";
import { getDictionary, isValidLocale, SUPPORTED_LOCALES } from "@/i18n/config";

function extractKeyPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      paths.push(...extractKeyPaths(value as Record<string, unknown>, fullPath));
    } else {
      paths.push(fullPath);
    }
  }
  return paths.sort();
}

function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

describe("i18n Dictionary Foundation", () => {
  it("supports English and Tamil locales", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "ta"]);
    expect(isValidLocale("en")).toBe(true);
    expect(isValidLocale("ta")).toBe(true);
    expect(isValidLocale("fr")).toBe(false);
    expect(isValidLocale(null)).toBe(false);
  });

  it("maintains 100% key parity between en.json and ta.json", () => {
    const enPaths = extractKeyPaths(enDictionary);
    const taPaths = extractKeyPaths(taDictionary);
    expect(taPaths).toEqual(enPaths);
  });

  it("has non-empty string values for every translation key in both languages", () => {
    const paths = extractKeyPaths(enDictionary);
    for (const path of paths) {
      const enVal = getValueByPath(enDictionary, path);
      const taVal = getValueByPath(taDictionary, path);
      expect(typeof enVal, `en.${path} should be a string`).toBe("string");
      expect((enVal as string).trim().length, `en.${path} should not be empty`).toBeGreaterThan(0);
      expect(typeof taVal, `ta.${path} should be a string`).toBe("string");
      expect((taVal as string).trim().length, `ta.${path} should not be empty`).toBeGreaterThan(0);
    }
  });

  it("returns the matching dictionary from getDictionary()", () => {
    expect(getDictionary("en").nav.home).toBe("Home");
    expect(getDictionary("ta").nav.home).toBe("முகப்பு");
  });
});
