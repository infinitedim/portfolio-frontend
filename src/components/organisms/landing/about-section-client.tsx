"use client";

import type { JSX } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { AboutInfo } from "@/lib/data/data-fetching";

interface AboutSectionClientProps {
  about: AboutInfo;
}

export function AboutSectionClient({
  about,
}: AboutSectionClientProps): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="border-t border-neutral-800 px-4 py-16">
      <div className="mx-auto max-w-6xl text-left animate-slide-in-up">
        <h2 className="mb-6 font-mono text-2xl font-bold text-green-400">
          {t("landingAboutTitle")}
        </h2>
        <div className="space-y-4 font-mono text-sm leading-relaxed text-neutral-300 max-w-3xl">
          <p className="text-lg font-semibold text-white">{about.title}</p>
          <p>{about.bio}</p>
        </div>
      </div>
    </section>
  );
}
