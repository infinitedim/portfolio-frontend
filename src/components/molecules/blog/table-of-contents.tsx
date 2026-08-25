/**
 * Represents a parsed heading extracted from article HTML.
 */
interface Heading {
  /** The anchor ID of the heading element. */
  id: string;
  /** The plain text title of the heading. */
  text: string;
  /** The heading depth level (e.g. 2 for h2, 3 for h3). */
  level: number;
}

/**
 * Extracts h2 and h3 heading tags from HTML content and generates slug anchors.
 *
 * @param html - Raw HTML content of the article.
 * @returns Array of parsed heading objects with level, id, and text.
 */
function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  const withIds = /<h([23])[^>]*\bid="([^"]+)"/i.test(html)
    ? html
    : html.replace(
        /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
        (match, level, attrs, inner) => {
          const text = inner.replace(/<[^>]+>/g, "").trim();
          const id =
            text
              .toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-") || `section-${headings.length + 1}`;
          headings.push({
            level: parseInt(level, 10),
            id,
            text,
          });
          return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
        },
      );

  if (headings.length > 0) return headings;

  const re = /<h([23])[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(withIds)) !== null) {
    headings.push({
      level: parseInt(match[1], 10),
      id: match[2],
      text: match[3].replace(/<[^>]+>/g, "").trim(),
    });
  }
  return headings;
}

/**
 * Props for the TableOfContents component.
 */
interface TableOfContentsProps {
  /** Raw HTML content string from which to extract headings. */
  contentHtml: string;
  /** Optional custom CSS classes for the container. */
  className?: string;
}

/**
 * TableOfContents component that parses HTML headings (h2/h3) and renders a
 * navigable index with jump links.
 *
 * @param props - Component properties.
 * @param props.contentHtml - Raw HTML string of the blog post.
 * @param props.className - Optional extra CSS class names for styling.
 * @returns The rendered table of contents navigation or null if fewer than 2 headings exist.
 */
export function TableOfContents({
  contentHtml,
  className = "",
}: TableOfContentsProps) {
  const headings = extractHeadings(contentHtml);

  if (headings.length < 2) return null;

  return (
    <nav
      className={`border border-neutral-800 bg-neutral-900/60 backdrop-blur-md rounded-xl p-4 font-mono ${className}`}
      aria-label="Table of contents"
    >
      <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 pb-2.5 mb-3 border-b border-neutral-800/80">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span>&gt;</span>
          <span>[ TOC :: index ]</span>
        </span>
        <span className="text-[10px] text-neutral-500 font-mono">
          {headings.length}_sections
        </span>
      </div>
      <ol className="space-y-2 text-xs">
        {headings.map((h, i) => (
          <li
            key={h.id}
            className={h.level === 3 ? "ml-3.5 border-l border-neutral-800 pl-2" : ""}
          >
            <a
              href={`#${h.id}`}
              className="text-neutral-400 hover:text-emerald-400 transition-colors line-clamp-1 flex items-center gap-1.5"
            >
              <span className="text-emerald-500/60 text-[10px]">
                {String(i + 1).padStart(2, "0")}.
              </span>
              <span>{h.text}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
