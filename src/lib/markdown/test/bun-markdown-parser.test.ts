import { describe, it, expect } from "bun:test";
import { parseMarkdownToHtml } from "../bun-markdown-parser";

describe("bun-markdown-parser", () => {
  it("should return empty string for empty input", async () => {
    const res = await parseMarkdownToHtml("");
    expect(res.html).toBe("");
  });

  it("should parse headers, bold, and links", async () => {
    const md = "# Title\n**Bold Text**\n[Link](https://example.com)";
    const res = await parseMarkdownToHtml(md);
    expect(res.html).toContain("Title");
    expect(res.html).toContain("Bold Text");
    expect(res.html).toContain("https://example.com");
    expect(["bun-markdown", "fallback-markdown"]).toContain(res.engineUsed);
  });
});
