"use client";

import { useState } from "react";

interface ShareButtonsProps {
  title: string;
  slug: string;
  summary?: string | null;
}

export function ShareButtons({ title, slug, summary }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://infinitedim.site";
  const url = `${baseUrl}/blog/${slug}`;
  const text = summary ? `${title} — ${summary}` : title;

  const handleCopyLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: summary ?? title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      throw new Error("Failed to copy link", { cause: "clipboard" });
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-gray-500">Share:</span>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs px-3 py-1.5 border border-gray-700 rounded hover:border-sky-400 text-gray-400 hover:text-sky-400 transition-colors"
        aria-label="Share on Twitter/X"
      >
        𝕏 Twitter
      </a>

      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs px-3 py-1.5 border border-gray-700 rounded hover:border-blue-400 text-gray-400 hover:text-blue-400 transition-colors"
        aria-label="Share on LinkedIn"
      >
        LinkedIn
      </a>

      <button
        onClick={handleCopyLink}
        className="text-xs px-3 py-1.5 border border-gray-700 rounded hover:border-green-400 text-gray-400 hover:text-green-400 transition-colors"
        aria-label="Copy link"
      >
        {copied ? "✓ Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
