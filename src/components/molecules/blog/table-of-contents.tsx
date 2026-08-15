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
