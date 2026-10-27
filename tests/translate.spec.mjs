// scripts/translate.mjs: the checks every machine translation must pass before it's written.
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { problemsWith, LANGUAGES } from "../scripts/translate.mjs";

test("a translation keeps placeholders, tokens and allowed HTML, and fits store limits", () => {
  expect(problemsWith("askSavedAs", "Gespeichert als $PATH$", "Saved as $PATH$")).toEqual([]);
  expect(problemsWith("askSavedAs", "Gespeichert als PATH", "Saved as $PATH$")).toEqual(["placeholders must be exactly: $PATH$"]);
  expect(problemsWith("optSubfolderHint", "Nutze {name} und <code>/</code>", "Use {name} and <code>/</code>")).toEqual([]);
  expect(problemsWith("optSubfolderHint", "Nutze {nombre} und <b>/</b>", "Use {name} and <code>/</code>")).toHaveLength(3);
  expect(problemsWith("extDescription", "x".repeat(133), "y")).toEqual(["at most 132 characters (now 133)"]);
  expect(problemsWith("amoSummary", "x".repeat(250), "y")).toEqual([]);
  expect(problemsWith("menuPalette", "  ", "Get colour palette")).toEqual(["empty"]);
  expect(problemsWith("menuNew", "$ITEM$ costs $5", "$ITEM$ ✨ New")).toContain('a stray "$" (write "$$" for a literal dollar)');
});

test("the languages are the Chrome Web Store's, and every one we ship is in the list", async () => {
  expect(Object.keys(LANGUAGES)).toHaveLength(50);
  for (const lang of ["zh_CN", "ru", "ko", "uk", "es", "pt_BR", "ja", "ar", "he", "hi", "de", "fr"]) expect(LANGUAGES).toHaveProperty(lang);
  const lock = JSON.parse(await readFile(new URL("../i18n/translations.lock.json", import.meta.url), "utf8"));
  for (const lang of Object.keys(lock)) expect(LANGUAGES, lang).toHaveProperty(lang);
});
