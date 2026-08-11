"use client";

import { useState } from "react";
import Link from "next/link";
import { type JSX } from "react";
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-950/20 via-neutral-950 to-neutral-950" />
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 font-mono text-xs text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span><span className="text-emerald-400">$</span> init portfolio</span>
        </div>

        <div>
          <h1 className="font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            {t("landingHeroTitle")}
          </h1>
        </div>
        <div>
          <p className="mx-auto mt-6 max-w-2xl font-mono text-base text-neutral-400 sm:text-lg">
            {t("landingHeroTagline")}
          </p>
        </div>
        <div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/projects"
              prefetch={false}
              className="rounded bg-emerald-400 px-5 py-2.5 font-mono text-sm font-medium text-neutral-950 transition-colors duration-200 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              {t("landingCtaProjects")}
            </Link>
            <button
              type="button"
              onClick={() => setIsResumeModalOpen(true)}
              className="rounded border border-neutral-700 px-5 py-2.5 font-mono text-sm text-neutral-300 transition-colors duration-200 hover:border-emerald-400/40 hover:text-emerald-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              ↓ Resume
            </button>
            <Link
              href="/contact"
              prefetch={false}
              className="rounded border border-neutral-700 px-5 py-2.5 font-mono text-sm text-neutral-300 transition-colors duration-200 hover:border-neutral-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
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
