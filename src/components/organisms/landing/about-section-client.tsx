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
    <section className="border-t border-neutral-800 px-4 py-16">
      <div className="mx-auto max-w-6xl text-left">
        <h2 className="mb-6 font-mono text-xl font-bold text-white">
          <span className="text-emerald-400">$</span> cat --about
        </h2>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6 md:p-8 border-l-2 border-l-emerald-400/40 space-y-4 font-mono text-sm leading-relaxed text-neutral-300 max-w-3xl">
          <p className="text-lg font-semibold text-white">{about.title}</p>
          <p>{about.bio}</p>
        </div>
      </div>
    </section>
  );
}
