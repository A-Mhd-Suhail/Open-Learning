import { describe, expect, it } from "vitest";
import { ALL_LANGUAGES, LANGUAGES, MAX_KNOWN, OTHER_LANGUAGES, PROFICIENCY, PROFICIENCY_LABEL, isLanguageLabel, isProficiency } from "@/lib/language/languages";

describe("language catalogue", () => {
  it("has no duplicates and ALL_LANGUAGES is the union", () => {
    const lower = ALL_LANGUAGES.map((l) => l.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
    expect(ALL_LANGUAGES.length).toBe(LANGUAGES.length + OTHER_LANGUAGES.length);
  });
  it("every catalogue entry is an acceptable label (matches DB 2-40 char rule)", () => {
    for (const l of ALL_LANGUAGES) expect(isLanguageLabel(l), l).toBe(true);
  });
  it("proficiency levels match the database check constraint and have labels", () => {
    expect([...PROFICIENCY]).toEqual(["beginner", "elementary", "intermediate", "advanced"]);
    for (const p of PROFICIENCY) expect(PROFICIENCY_LABEL[p].length).toBeGreaterThan(0);
  });
  it("MAX_KNOWN matches the database limit of 12", () => expect(MAX_KNOWN).toBe(12));
});

describe("isProficiency", () => {
  it("accepts only the four levels (case-sensitive)", () => {
    expect(isProficiency("beginner")).toBe(true);
    expect(isProficiency("advanced")).toBe(true);
    expect(isProficiency("expert")).toBe(false);
    expect(isProficiency("Beginner")).toBe(false);
    expect(isProficiency("")).toBe(false);
  });
});

describe("isLanguageLabel", () => {
  it("enforces 2-40 characters after trimming", () => {
    expect(isLanguageLabel("a")).toBe(false);
    expect(isLanguageLabel(" a ")).toBe(false);
    expect(isLanguageLabel("ab")).toBe(true);
    expect(isLanguageLabel("x".repeat(40))).toBe(true);
    expect(isLanguageLabel("x".repeat(41))).toBe(false);
    expect(isLanguageLabel("")).toBe(false);
    expect(isLanguageLabel("      ")).toBe(false);
  });
  it("rejects control characters and angle brackets", () => {
    expect(isLanguageLabel("Tam\nil")).toBe(false);
    expect(isLanguageLabel("Tam\u0000il")).toBe(false);
    expect(isLanguageLabel("<b>")).toBe(false);
    expect(isLanguageLabel("a<script>")).toBe(false);
  });
  it("accepts non-latin names and punctuation", () => {
    expect(isLanguageLabel("தமிழ்")).toBe(true);
    expect(isLanguageLabel("日本語")).toBe(true);
    expect(isLanguageLabel("Chinese (Mandarin)")).toBe(true);
  });
});
