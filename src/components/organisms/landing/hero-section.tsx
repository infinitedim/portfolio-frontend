"use client";

import Link from "next/link";
import { type JSX } from "react";
import { useI18n } from "@/hooks/use-i18n";
import {
  FadeIn,
  StaggerContainer,
} from "@/components/atoms/shared/motion-wrappers";

export function HeroSection(): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden px-4 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-green-900/20 via-neutral-950 to-neutral-950" />
      <StaggerContainer className="relative mx-auto max-w-4xl text-center">
        <FadeIn
          direction="up"
          delay={0.1}
          duration={0.6}
        >
          <h1 className="font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            {t("landingHeroTitle")}
          </h1>
        </FadeIn>
        <FadeIn
          direction="up"
          delay={0.2}
          duration={0.6}
        >
          <p className="mx-auto mt-6 max-w-2xl font-mono text-base text-neutral-400 sm:text-lg">
            {t("landingHeroTagline")}
          </p>
        </FadeIn>
        <FadeIn
          direction="up"
          delay={0.35}
          duration={0.6}
        >
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/projects"
              className="rounded border border-green-400/40 bg-green-400/10 px-5 py-2.5 font-mono text-sm text-green-400 transition-colors hover:bg-green-400/20"
            >
              {t("landingCtaProjects")}
            </Link>
            <Link
              href="/contact"
              className="rounded border border-neutral-700 px-5 py-2.5 font-mono text-sm text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
            >
              {t("landingCtaContact")}
            </Link>
          </div>
        </FadeIn>
      </StaggerContainer>
    </section>
  );
}
