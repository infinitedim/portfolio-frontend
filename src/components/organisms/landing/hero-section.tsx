"use client";

import { useState } from "react";
import Link from "next/link";
import { type JSX } from "react";
import { Download } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import dynamic from "next/dynamic";

const TurnstileResumeModal = dynamic(
  () =>
    import("@/components/molecules/shared/turnstile-resume-modal").then(
      (mod) => mod.TurnstileResumeModal,
    ),
  { ssr: false },
);

export function HeroSection(): JSX.Element {
  const { t } = useI18n();
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  return (
    <section className="relative overflow-hidden px-4 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-(--terminal-accent)/15 via-(--terminal-bg) to-(--terminal-bg)" />
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-(--terminal-border) bg-(--terminal-bg)/80 px-3 py-1 font-mono text-xs text-(--terminal-muted)">
          <span className="h-1.5 w-1.5 rounded-full bg-(--terminal-accent) animate-pulse" />
          <span>
            <span className="text-(--terminal-accent)">$</span> init portfolio
          </span>
        </div>

        <div>
          <h1 className="font-mono text-4xl font-bold tracking-tight text-(--terminal-text) sm:text-5xl md:text-6xl">
            {t("landingHeroTitle")}
          </h1>
        </div>
        <div>
          <p className="mx-auto mt-6 max-w-2xl font-mono text-base text-(--terminal-muted) sm:text-lg">
            {t("landingHeroTagline")}
          </p>
        </div>
        <div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/projects"
              prefetch={false}
              className="rounded bg-(--terminal-accent) px-5 py-2.5 font-mono text-sm font-semibold text-(--terminal-bg) transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--terminal-accent)"
            >
              {t("landingCtaProjects")}
            </Link>
            <button
              type="button"
              onClick={() => setIsResumeModalOpen(true)}
              className="group inline-flex items-center gap-2 rounded border border-(--terminal-border) px-5 py-2.5 font-mono text-sm text-(--terminal-text) transition-colors duration-200 hover:border-(--terminal-accent)/60 hover:text-(--terminal-accent) cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--terminal-accent)"
            >
              <Download
                size={14}
                className="transition-transform duration-200 group-hover:translate-y-0.5"
              />
              Resume
            </button>
            <Link
              href="/contact"
              prefetch={false}
              className="rounded border border-(--terminal-border) px-5 py-2.5 font-mono text-sm text-(--terminal-muted) transition-colors duration-200 hover:border-(--terminal-text) hover:text-(--terminal-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--terminal-accent)"
            >
              {t("landingCtaContact")}
            </Link>
          </div>
        </div>
      </div>

      <TurnstileResumeModal
        isOpen={isResumeModalOpen}
        onOpenChange={setIsResumeModalOpen}
      />
    </section>
  );
}
