"use client";

import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n";

interface ShareButtonsProps {
  title: string;
  slug: string;
  summary?: string | null;
}

export function ShareButtons({ title, slug, summary }: ShareButtonsProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://infinitedim.dev";
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
    <div className="flex flex-wrap items-center gap-3 font-mono">
      <span className="text-sm text-terminal-muted font-mono">
        {t("blogShare")}
      </span>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs px-3 py-1.5 border border-terminal-border rounded hover:border-sky-400/80 text-terminal-muted hover:text-sky-400 transition-colors"
        aria-label={t("blogShareTwitter")}
      >
        𝕏 Twitter
      </a>

      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs px-3 py-1.5 border border-terminal-border rounded hover:border-blue-400/80 text-terminal-muted hover:text-blue-400 transition-colors"
        aria-label={t("blogShareLinkedin")}
      >
        LinkedIn
      </a>

      <button
        onClick={handleCopyLink}
        className="text-xs px-3 py-1.5 border border-terminal-border rounded hover:border-terminal-accent text-terminal-muted hover:text-terminal-accent transition-colors cursor-pointer"
        aria-label={t("blogCopyLink")}
      >
        {copied ? t("blogCopied") : t("blogCopyLink")}
      </button>
    </div>
  );
}
