import { describe, it, expect } from "bun:test";
import { TypoTolerance } from "../typo-tolerance";

describe("commands/typo-tolerance", () => {
  it("levenshteinDistance calculates edit distance between strings", () => {
    expect(TypoTolerance.levenshteinDistance("help", "help")).toBe(0);
    expect(TypoTolerance.levenshteinDistance("hlp", "help")).toBe(1);
    expect(TypoTolerance.levenshteinDistance("cat", "dog")).toBe(3);
  });

  it("findSimilarCommand finds closest command within threshold", () => {
    const commands = ["help", "projects", "contact", "about"];
    expect(TypoTolerance.findSimilarCommand("hlp", commands)).toBe("help");
    expect(TypoTolerance.findSimilarCommand("project", commands)).toBe("projects");
    expect(TypoTolerance.findSimilarCommand("xyz12345", commands)).toBeNull();
  });

  it("fuzzyMatch filters and sorts matching commands", () => {
    const commands = ["projects", "project-list", "contact"];
    const matches = TypoTolerance.fuzzyMatch("project", commands);
    expect(matches).toContain("projects");
  });

  it("getSuggestionScore returns scores based on match quality", () => {
    expect(TypoTolerance.getSuggestionScore("help", "help")).toBe(100);
    expect(TypoTolerance.getSuggestionScore("pro", "projects")).toBeGreaterThan(80);
    expect(TypoTolerance.getSuggestionScore("ject", "projects")).toBeGreaterThan(30);
    expect(TypoTolerance.getSuggestionScore("hlp", "help")).toBeGreaterThan(0);
    expect(TypoTolerance.getSuggestionScore("unknownrandom", "help")).toBe(0);
  });

  it("getSuggestionType classifies suggestion match types", () => {
    expect(TypoTolerance.getSuggestionType("help", "help")).toBe("exact");
    expect(TypoTolerance.getSuggestionType("pro", "projects")).toBe("prefix");
    expect(TypoTolerance.getSuggestionType("ject", "projects")).toBe("fuzzy");
    expect(TypoTolerance.getSuggestionType("hlp", "help")).toBe("typo");
  });
});
