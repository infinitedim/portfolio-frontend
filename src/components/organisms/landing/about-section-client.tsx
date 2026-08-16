"use client";

import type { JSX } from "react";
import { AboutInfo } from "@/lib/data/data-fetching";

interface AboutSectionClientProps {
  about: AboutInfo;
}

export function AboutSectionClient({
  about,
}: AboutSectionClientProps): JSX.Element {
  return (
    <section className="border-t border-(--terminal-border) px-4 py-16 transition-colors duration-300">
      <div className="mx-auto max-w-6xl text-left font-mono">
        <h2 className="mb-6 font-mono text-xl font-bold text-(--terminal-text)">
          <span className="text-(--terminal-accent)">$</span> cat --about
        </h2>
        <div className="rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/70 p-6 md:p-8 border-l-2 border-l-(--terminal-accent)/60 space-y-4 font-mono text-sm leading-relaxed text-(--terminal-muted) max-w-3xl">
          <p className="text-lg font-semibold text-(--terminal-text)">{about.title}</p>
          <p>{about.bio}</p>
        </div>
      </div>
    </section>
  );
}
