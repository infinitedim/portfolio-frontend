"use client";

import type { JSX } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { sanitize } from "isomorphic-dompurify";

/**
 * Properties for the BlogContent renderer component.
 *
 * @interface BlogContentProps
 * @property {string | null} [html] - Sanitized or raw HTML string content to render.
 * @property {string | null} [md] - Raw markdown fallback text if HTML is unavailable.
 */
export interface BlogContentProps {
  html?: string | null;
  md?: string | null;
}

/**
 * Enhances HTML markup by injecting native `loading="lazy"` and `decoding="async"` attributes onto `<img>` elements.
 *
 * @param {string} html - Raw sanitized HTML markup string.
 * @returns {string} Optimized HTML string with lazy loading image attributes added.
 */
function enhanceBlogImages(html: string): string {
  return html.replace(
    /<img\s(?![^>]*\bloading=)(?![^>]*\bdecoding=)/gi,
    '<img loading="lazy" decoding="async" ',
  );
}

/**
 * Renders blog post article content with DOMPurify sanitization and image lazy loading.
 *
 * Safely parses HTML markup with typography prose classes, renders formatted pre-wrap markdown fallback,
 * or displays an empty content notice if no text is provided.
 *
 * @param {BlogContentProps} props - Component properties.
 * @param {string | null} [props.html] - HTML content string to sanitize and render.
 * @param {string | null} [props.md] - Fallback raw markdown content string.
 * @returns {JSX.Element} The rendered blog article content container.
 */
export function BlogContent({ html, md }: BlogContentProps): JSX.Element {
  const { t } = useI18n();

  if (html) {
    const cleanHtml = enhanceBlogImages(sanitize(html));
    return (
      <div
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
        className="prose prose-invert max-w-none
          prose-headings:text-terminal-accent
          prose-a:text-terminal-accent hover:prose-a:text-terminal-accent/85
          prose-strong:text-terminal-text
          prose-code:text-terminal-accent
          prose-code:bg-terminal-accent/10
          prose-code:px-1
          prose-code:rounded
          prose-pre:bg-terminal-bg/50
          prose-pre:border
          prose-pre:border-terminal-border
          prose-pre:relative"
      />
    );
  }

  if (md) {
    return (
      <div className="whitespace-pre-wrap font-mono text-sm text-terminal-text">
        {md}
      </div>
    );
  }

  return <p className="text-terminal-muted font-mono">{t("blogNoContent")}</p>;
}
