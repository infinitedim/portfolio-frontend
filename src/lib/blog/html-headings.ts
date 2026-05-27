/** Slugify heading text for anchor IDs. */
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

/** Ensure h2/h3 elements in HTML have stable id attributes for TOC anchors. */
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
