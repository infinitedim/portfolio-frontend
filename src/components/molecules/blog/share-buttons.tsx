"use client";

import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { Share2, Link as LinkIcon, Check } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  slug: string;
  summary?: string | null;
}

export function ShareButtons({ title, slug, summary }: ShareButtonsProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://infinitedim.dev";
  const url = `${baseUrl}/blog/${slug}`;
  const text = summary ? `${title} — ${summary}` : title;

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: summary ?? title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } // eslint-disable-next-line no-empty
    catch {}
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap items-center gap-3 font-mono">
      <span className="text-xs text-neutral-500 font-mono flex items-center gap-1.5">
        <Share2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>{t("blogShare")}</span>
      </span>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs px-3 py-1.5 border border-neutral-800 bg-neutral-900/60 rounded-md hover:border-sky-400/50 hover:bg-neutral-800 text-neutral-300 hover:text-sky-400 transition-colors inline-flex items-center gap-1.5"
        aria-label={t("blogShareTwitter")}
      >
        <span>$ share --twitter</span>
      </a>

      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs px-3 py-1.5 border border-neutral-800 bg-neutral-900/60 rounded-md hover:border-blue-400/50 hover:bg-neutral-800 text-neutral-300 hover:text-blue-400 transition-colors inline-flex items-center gap-1.5"
        aria-label={t("blogShareLinkedin")}
      >
        <span>$ share --linkedin</span>
      </a>

      <button
        onClick={handleCopyLink}
        className="text-xs px-3 py-1.5 border border-neutral-800 bg-neutral-900/60 rounded-md hover:border-emerald-400/50 hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer inline-flex items-center gap-1.5"
        aria-label={t("blogCopyLink")}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">[ COPIED ]</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-3.5 h-3.5 text-neutral-400" />
            <span>$ copy --url</span>
          </>
        )}
      </button>
    </div>
  );
}
