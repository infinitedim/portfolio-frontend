import { describe, it, expect } from "bun:test";
import { parseMarkdownToHtml } from "../bun-markdown-parser";

describe("markdown/bun-markdown-parser", () => {
  it("should return empty html for empty markdown text", async () => {
    const res = await parseMarkdownToHtml("");
    expect(res.html).toBe("");
    expect(res.engineUsed).toBe("fallback-markdown");
  });

  it("should process headers, bold, italics, links, and lists using fallback parser when Bun.markdown is disabled", async () => {
    const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun as
      | { markdown?: unknown }
      | undefined;
    const originalMarkdown = bunGlobal?.markdown;
    if (bunGlobal) bunGlobal.markdown = undefined;

    try {
      const markdown = "# Title\n## Section\n### Sub\n**bold** and *italic*\n[Link](https://example.com)\n* Bullet item";
      const res = await parseMarkdownToHtml(markdown);

      expect(res.engineUsed).toBe("fallback-markdown");
      expect(res.html).toContain("<h1>Title</h1>");
      expect(res.html).toContain("<h2>Section</h2>");
      expect(res.html).toContain("<h3>Sub</h3>");
      expect(res.html).toContain("<strong>bold</strong>");
      expect(res.html).toContain("<em>italic</em>");
      expect(res.html).toContain('<a href="https://example.com" target="_blank" rel="noopener">Link</a>');
      expect(res.html).toContain("<ul><li>Bullet item</li></ul>");
    } finally {
      if (bunGlobal) bunGlobal.markdown = originalMarkdown;
    }
  });

  it("should use native Bun.markdown parser when available", async () => {
    const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun as
      | { markdown?: { html?: (s: string) => string } }
      | undefined;

    if (!bunGlobal) return;

    const originalMarkdown = bunGlobal.markdown;
    bunGlobal.markdown = {
      html: (input: string) => `<p>Native ${input}</p>`,
    };

    try {
      const res = await parseMarkdownToHtml("Hello Native");
      expect(res.engineUsed).toBe("bun-markdown");
      expect(res.html).toBe("<p>Native Hello Native</p>");
    } finally {
      bunGlobal.markdown = originalMarkdown;
    }
  });

  it("should fall through to fallback parser if Bun.markdown.html throws error", async () => {
    const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun as
      | { markdown?: { html?: (s: string) => string } }
      | undefined;

    if (!bunGlobal) return;

    const originalMarkdown = bunGlobal.markdown;
    bunGlobal.markdown = {
      html: () => {
        throw new Error("Native markdown crash");
      },
    };

    try {
      const res = await parseMarkdownToHtml("# Crashed Title");
      expect(res.engineUsed).toBe("fallback-markdown");
      expect(res.html).toContain("<h1>Crashed Title</h1>");
    } finally {
      bunGlobal.markdown = originalMarkdown;
    }
  });
});
