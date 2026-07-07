"use client";

import React from "react";
import { useI18n } from "@/hooks/use-i18n";

export interface BlogContentProps {
  html?: string | null;
  md?: string | null;
}

export function BlogContent({ html, md }: BlogContentProps) {
  const { t } = useI18n();

  if (html) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: html }}
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
