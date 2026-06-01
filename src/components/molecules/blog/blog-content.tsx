import React from "react";

export interface BlogContentProps {
  html?: string | null;
  md?: string | null;
}

export function BlogContent({ html, md }: BlogContentProps) {
  if (html) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className="prose prose-invert prose-green max-w-none
          prose-headings:text-green-400
          prose-a:text-green-400
          prose-strong:text-gray-100
          prose-code:text-green-300
          prose-code:bg-gray-800
          prose-code:px-1
          prose-code:rounded
          prose-pre:bg-gray-900
          prose-pre:border
          prose-pre:border-gray-800
          prose-pre:relative"
      />
    );
  }

  if (md) {
    return (
      <div className="whitespace-pre-wrap font-mono text-sm text-gray-300">
        {md}
      </div>
    );
  }

  return <p className="text-gray-500">No content available.</p>;
}
