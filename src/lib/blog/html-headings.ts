/**
 * Converts a raw heading string or HTML fragment into a URL-friendly, lowercase kebab-case slug.
 * Strips HTML tags, removes special punctuation, collapses whitespaces and dashes.
 *
 * @param {string} text - The raw heading text or HTML string to be slugified.
 * @returns {string} The normalized kebab-case slug string.
 * @example
 * ```ts
 * slugifyHeading("Getting Started with TypeScript 5.0!"); // "getting-started-with-typescript-50"
 * ```
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parses raw HTML content and injects unique kebab-case `id` attributes into all `<h2>` and `<h3>` heading tags.
 * Preserves existing `id` attributes if already present and handles duplicates by appending incremental numeric suffixes.
 *
 * @param {string} html - The input HTML string containing blog post markup.
 * @returns {string} The transformed HTML markup with unique `id` attributes on all level 2 and 3 headings.
 * @example
 * ```ts
 * const processed = addHeadingIdsToHtml("<h2>Introduction</h2><h2>Introduction</h2>");
 * // Result: '<h2 id="introduction">Introduction</h2><h2 id="introduction-2">Introduction</h2>'
 * ```
 */
export function addHeadingIdsToHtml(html: string): string {
  const used = new Set<string>();

  return html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_match, level: string, attrs: string, inner: string) => {
      const existing = attrs.match(/\bid="([^"]+)"/i);
      if (existing) {
        used.add(existing[1]);
        return `<h${level}${attrs}>${inner}</h${level}>`;
      }

      const text = inner.replace(/<[^>]+>/g, "").trim();
      const base = slugifyHeading(text) || `section-${used.size + 1}`;
      let id = base;
      let n = 2;
      while (used.has(id)) {
        id = `${base}-${n}`;
        n += 1;
      }
      used.add(id);

      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    },
  );
}
