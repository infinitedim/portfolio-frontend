/**
 * Represents the result of parsing a Markdown string into HTML.
 *
 * @interface MarkdownParseResult
 * @property {string} html - The parsed HTML output string.
 * @property {"bun-markdown" | "fallback-markdown"} engineUsed - The parsing engine utilized for conversion.
 */
export interface MarkdownParseResult {
  /**
   * The resulting HTML string rendered from the source Markdown.
   */
  html: string;

  /**
   * The identifier indicating which engine parsed the Markdown.
   */
  engineUsed: "bun-markdown" | "fallback-markdown";
}

/**
 * Interface representing the native Bun markdown parser structure on the global runtime object.
 *
 * @interface BunMarkdownGlobal
 */
interface BunMarkdownGlobal {
  /**
   * Parses markdown input to HTML string or Promise of HTML string.
   *
   * @param {string} input - The raw markdown input string.
   * @returns {string | Promise<string>} The parsed HTML result.
   */
  html?(input: string): string | Promise<string>;
}

/**
 * Parses markdown text into HTML, attempting to leverage Bun's native markdown engine
 * if available in the execution environment, otherwise falling back to a lightweight regex parser.
 *
 * @async
 * @function parseMarkdownToHtml
 * @param {string} markdownText - The raw markdown string to convert into HTML.
 * @returns {Promise<MarkdownParseResult>} A promise resolving to the parse result containing HTML and the engine identifier.
 */
export async function parseMarkdownToHtml(markdownText: string): Promise<MarkdownParseResult> {
  if (!markdownText) {
    return { html: "", engineUsed: "fallback-markdown" };
  }

  const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun as
    | { markdown?: BunMarkdownGlobal }
    | undefined;

  if (bunGlobal && typeof bunGlobal.markdown?.html === "function") {
    try {
      const resultHtml = await bunGlobal.markdown.html(markdownText);
      return {
        html: typeof resultHtml === "string" ? resultHtml : String(resultHtml),
        engineUsed: "bun-markdown",
      };
    } // eslint-disable-next-line no-empty
    catch {}
  }

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
