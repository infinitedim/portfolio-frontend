import { type JSX } from "react";
import { getAboutData } from "@/lib/data/data-fetching";

export async function AboutSection(): Promise<JSX.Element | null> {
  const about = await getAboutData();

  if (!about?.bio) {
    return null;
  }

  return (
    <section className="border-t border-neutral-800 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-6 font-mono text-2xl font-bold text-green-400">
          About
        </h2>
        <div className="space-y-4 font-mono text-sm leading-relaxed text-neutral-300">
          <p className="text-lg text-white">{about.title}</p>
          <p>{about.bio}</p>
          {about.location && (
            <p className="text-neutral-500">📍 {about.location}</p>
          )}
        </div>
      </div>
    </section>
  );
}
