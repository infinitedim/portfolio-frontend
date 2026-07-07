"use client";

import { type JSX } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { FadeIn } from "@/components/atoms/shared/motion-wrappers";
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
      <FadeIn
        direction="up"
        duration={0.6}
        className="mx-auto max-w-4xl"
      >
        <h2 className="mb-6 font-mono text-2xl font-bold text-green-400">
          {t("landingAboutTitle")}
        </h2>
        <div className="space-y-4 font-mono text-sm leading-relaxed text-neutral-300">
          <p className="text-lg text-white">{about.title}</p>
          <p>{about.bio}</p>
          {about.location && (
            <p className="text-neutral-500">
              {t("aboutLocation")}: {about.location}
            </p>
          )}
        </div>
      </FadeIn>
    </section>
  );
}
