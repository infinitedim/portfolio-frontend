"use client";

import { useRouter } from "next/navigation";
import { type JSX, useState, useEffect } from "react";
import { TerminalFeaturesModal } from "@/components/molecules/shared/terminal-features-modal";
import { FadeIn, HoverCard } from "@/components/atoms/shared/motion-wrappers";
import { useI18n } from "@/hooks/use-i18n";
import { gateClient } from "@/lib/gate/gate-client";

export function TerminalCta(): JSX.Element {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const hasCookie = typeof document !== "undefined" && document.cookie.includes("portfolio_gate");
    if (hasCookie) {
      setIsUnlocked(true);
    } else {
      gateClient
        .getStatus()
        .then((status) => {
          if (status.unlocked) {
            setIsUnlocked(true);
          }
          return null;
        })
        .catch(() => {
          // Fail silently, default to locked state
        });
    }
  }, []);

  return (
    <section className="hidden sm:block border-t border-neutral-800 px-4 py-16 cv-auto-section">
      <FadeIn
        direction="up"
        duration={0.6}
        className="mx-auto max-w-6xl"
      >
        <HoverCard
          scale={1}
          className="mx-auto max-w-2xl rounded-lg border border-neutral-800 bg-neutral-900/50 p-8 text-center"
        >
          <div>
            {isUnlocked ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs mb-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>SYSTEM ACCESS :: UNLOCKED</span>
                </div>
                <h2 className="mt-2 font-mono text-xl font-bold text-white">
                  <span className="text-emerald-400">$</span> exec --terminal
                </h2>
                <p className="mx-auto mt-3 max-w-lg font-mono text-sm text-neutral-400">
                  Terminal access granted. Click below to launch your interactive CLI session.
                </p>
                <button
                  onClick={() => router.push("/terminal")}
                  className="mt-6 inline-block rounded border border-emerald-400 bg-emerald-400 text-neutral-950 px-6 py-2.5 font-mono text-sm font-semibold transition-colors duration-200 hover:bg-emerald-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 shadow-lg shadow-emerald-500/10"
                >
                  Launch Terminal →
                </button>
              </>
            ) : (
              <>
                <p className="font-mono text-xs uppercase tracking-widest text-emerald-400/70 font-medium">
                  {t("landingCtaTerminalGate")}
                </p>
                <h2 className="mt-3 font-mono text-xl font-bold text-white">
                  <span className="text-emerald-400">$</span> exec --terminal
                </h2>
                <p className="mx-auto mt-4 max-w-lg font-mono text-sm text-neutral-400">
                  {t("landingCtaTerminalDesc")}
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-6 inline-block rounded border border-emerald-400/40 bg-emerald-400/10 px-6 py-2.5 font-mono text-sm text-emerald-400 transition-colors duration-200 hover:bg-emerald-400/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  {t("landingCtaTerminalButton")} →
                </button>
              </>
            )}
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
