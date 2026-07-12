"use client";

import { useRouter } from "next/navigation";
import { type JSX, useState } from "react";
import { TerminalFeaturesModal } from "@/components/molecules/shared/terminal-features-modal";
import { FadeIn, HoverCard } from "@/components/atoms/shared/motion-wrappers";
import { useI18n } from "@/hooks/use-i18n";

export function TerminalCta(): JSX.Element {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useI18n();

  return (
    <section className="border-t border-neutral-800 px-4 py-16">
      <FadeIn
        direction="up"
        duration={0.6}
        className="mx-auto max-w-6xl"
      >
        <HoverCard
          scale={1.01}
          className="mx-auto max-w-2xl rounded-lg border border-green-400/20 bg-green-400/5 p-8 text-center"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-green-400/70">
              {t("landingCtaTerminalGate")}
            </p>
            <h2 className="mt-3 font-mono text-2xl font-bold text-white">
              {t("landingCtaTerminal")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg font-mono text-sm text-neutral-400">
              {t("landingCtaTerminalDesc")}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-block rounded border border-green-400 bg-green-400/10 px-6 py-2.5 font-mono text-sm text-green-400 transition-colors hover:bg-green-400/20 cursor-pointer"
            >
              {t("landingCtaTerminalButton")} →
            </button>
          </div>
        </HoverCard>
      </FadeIn>

      <TerminalFeaturesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProceed={() => {
          setIsModalOpen(false);
          router.push("/gate");
        }}
      />
    </section>
  );
}
