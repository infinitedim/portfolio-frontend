"use client";

import { useRouter } from "next/navigation";
import { type JSX, useState, useEffect } from "react";
import { TerminalFeaturesModal } from "@/components/molecules/shared/terminal-features-modal";
import { FadeIn } from "@/components/atoms/shared/motion-wrappers";
import { useI18n } from "@/hooks/use-i18n";
import { gateClient } from "@/lib/gate/gate-client";

export function TerminalCta(): JSX.Element {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const hasCookie =
      typeof document !== "undefined" &&
      document.cookie.includes("portfolio_gate");
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

  const NATAS_PUZZLES = [
    { code: "L01", label: "Auth Bypass", desc: "Static Login Credential Audit" },
    { code: "L02", label: "Discovery", desc: "Hidden Path & File Inspection" },
    { code: "L03", label: "Headers", desc: "Referer Check & Payload Decode" },
  ];

  return (
    <section className="hidden sm:block border-t border-neutral-800 px-4 py-16 cv-auto-section">
      <FadeIn
        direction="up"
        duration={0.6}
        className="mx-auto max-w-6xl"
      >
        <div className="mx-auto max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900/60 shadow-2xl backdrop-blur-md overflow-hidden relative font-mono">
          {/* Top Hairline Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0" />

          {/* Window Header */}
          <div className="flex items-center justify-between border-b border-neutral-800/80 bg-neutral-950/80 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-neutral-400 text-[11px]">
              ~/security/natas_gate.sh
            </span>
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
              [HS256]
            </span>
          </div>

          {/* Window Body */}
          <div className="p-6 sm:p-8 text-center flex flex-col items-center gap-5">
            {isUnlocked ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>gate.status :: ACCESS_GRANTED</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    <span className="text-emerald-400">$</span> exec --terminal
                  </h2>
                  <p className="mx-auto max-w-lg text-xs sm:text-sm text-neutral-400 leading-relaxed">
                    Interactive CLI session unlocked. Launch terminal to execute commands, switch themes, and access developer tools.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/terminal")}
                  className="mt-2 rounded-lg bg-emerald-400 text-neutral-950 font-semibold px-6 py-2.5 text-xs sm:text-sm hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer select-none"
                >
                  $ terminal --launch →
                </button>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>gate.status :: RESTRICTED (3 Puzzles Stand Between You)</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    <span className="text-emerald-400">$</span> exec --terminal --gate=NATAS
                  </h2>
                  <p className="mx-auto max-w-lg text-xs sm:text-sm text-neutral-400 leading-relaxed">
                    {t("landingCtaTerminalDesc")}
                  </p>
                </div>

                {/* 3 NATAS Level Preview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg text-left my-1">
                  {NATAS_PUZZLES.map((puzzle) => (
                    <div
                      key={puzzle.code}
                      className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3 flex flex-col gap-1 transition-colors hover:border-neutral-700"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-bold">{puzzle.code}</span>
                        <span className="text-neutral-500 text-[10px]">{puzzle.label}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-tight">
                        {puzzle.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold px-6 py-2.5 text-xs sm:text-sm hover:bg-emerald-500/20 transition-colors cursor-pointer select-none"
                >
                  $ gate --enter-challenges →
                </button>
              </>
            )}
          </div>
        </div>
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
