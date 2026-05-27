interface Heading {
  id: string;
  text: string;
  level: number;
}

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

interface TableOfContentsProps {
  contentHtml: string;
  className?: string;
}

export function TableOfContents({
  contentHtml,
  className = "",
}: TableOfContentsProps) {
  const headings = extractHeadings(contentHtml);

  if (headings.length < 2) return null;

  return (
    <nav
      className={`border border-gray-800 rounded-lg p-4 ${className}`}
      aria-label="Table of contents"
    >
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Contents
      </p>
      <ol className="space-y-1.5">
        {headings.map((h) => (
          <li
            key={h.id}
            className={h.level === 3 ? "ml-4" : ""}
          >
            <a
              href={`#${h.id}`}
              className="text-sm text-gray-400 hover:text-green-400 transition-colors line-clamp-1"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
