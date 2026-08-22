export interface MarkdownParseResult {
  html: string;
  engineUsed: "bun-markdown" | "fallback-markdown";
}

interface BunMarkdownGlobal {
  html?(input: string): string | Promise<string>;
}

/**
 * Parses markdown to HTML using Bun.markdown native C++ CommonMark parser
 * when running in Bun 1.4+, with graceful fallback for Node.js / Vercel.
 */
export async function parseMarkdownToHtml(markdownText: string): Promise<MarkdownParseResult> {
  if (!markdownText) {
    return { html: "", engineUsed: "fallback-markdown" };
  }

  const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun as
    | { markdown?: BunMarkdownGlobal }
    | undefined;

  // Try native Bun.markdown C++ parser
  if (bunGlobal && typeof bunGlobal.markdown?.html === "function") {
    try {
      const resultHtml = await bunGlobal.markdown.html(markdownText);
      return {
        html: typeof resultHtml === "string" ? resultHtml : String(resultHtml),
        engineUsed: "bun-markdown",
      };
    } catch {
      // Fall through to fallback on error
    }
  }

  // Graceful light fallback parser (converts headers, bold, italics, links, lists)
  const html = markdownText
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*)\*/gim, "<em>$1</em>")
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^\* (.*$)/gim, "<ul><li>$1</li></ul>")
    .replace(/\n/gim, "<br />");

  return {
    html: html.trim(),
    engineUsed: "fallback-markdown",
  };
}
