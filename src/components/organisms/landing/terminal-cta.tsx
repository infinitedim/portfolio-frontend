"use client";

import { useRouter } from "next/navigation";
import { type JSX, useState, useEffect } from "react";
import { ArrowRight, ShieldAlert } from "lucide-react";
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
    <section className="hidden sm:block border-t border-(--terminal-border) px-4 py-16 cv-auto-section">
      <FadeIn
        direction="up"
        duration={0.6}
        className="mx-auto max-w-6xl"
      >
        <div className="mx-auto max-w-2xl rounded-xl border border-(--terminal-border) bg-(--terminal-bg)/90 shadow-2xl backdrop-blur-md overflow-hidden relative font-mono transition-colors duration-300">
          {/* Top Hairline Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-(--terminal-accent)/0 via-(--terminal-accent) to-(--terminal-accent)/0" />

          {/* Window Header */}
          <div className="flex items-center justify-between border-b border-(--terminal-border)/80 bg-(--terminal-bg)/95 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-(--terminal-accent)/80" />
            </div>
            <span className="text-(--terminal-muted) text-[11px]">
              ~/security/natas_gate.sh
            </span>
            <span className="text-[10px] text-(--terminal-muted)/70 uppercase tracking-widest">
              [HS256]
            </span>
          </div>

          {/* Window Body */}
          <div className="p-6 sm:p-8 text-center flex flex-col items-center gap-5">
            {isUnlocked ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-(--terminal-accent)/30 bg-(--terminal-accent)/10 text-(--terminal-accent) text-xs">
                  <span className="h-2 w-2 rounded-full bg-(--terminal-accent)" />
                  <span>gate.status :: ACCESS_GRANTED</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-(--terminal-text) tracking-tight">
                    <span className="text-(--terminal-accent)">$</span> exec --terminal
                  </h2>
                  <p className="mx-auto max-w-lg text-xs sm:text-sm text-(--terminal-muted) leading-relaxed">
                    Interactive CLI session unlocked. Launch terminal to execute commands, switch themes, and access developer tools.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/terminal")}
                  className="group mt-2 inline-flex items-center gap-2 rounded-lg bg-(--terminal-accent) text-(--terminal-bg) font-semibold px-6 py-2.5 text-xs sm:text-sm hover:opacity-90 transition-colors shadow-lg shadow-(--terminal-accent)/10 cursor-pointer select-none"
                >
                  $ terminal --launch
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-200 ease-out group-hover:translate-x-1"
                  />
                </button>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-(--terminal-accent)/30 bg-(--terminal-accent)/10 text-(--terminal-accent) text-xs">
                  <span className="h-2 w-2 rounded-full bg-(--terminal-accent)" />
                  <span>gate.status :: RESTRICTED (3 Puzzles Stand Between You)</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-(--terminal-text) tracking-tight">
                    <span className="text-(--terminal-accent)">$</span> exec --terminal --gate=NATAS
                  </h2>
                  <p className="mx-auto max-w-lg text-xs sm:text-sm text-(--terminal-muted) leading-relaxed">
                    {t("landingCtaTerminalDesc")}
                  </p>
                </div>

                {/* 3 NATAS Level Preview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg text-left my-1">
                  {NATAS_PUZZLES.map((puzzle) => (
                    <div
                      key={puzzle.code}
                      className="rounded-lg border border-(--terminal-border) bg-(--terminal-bg)/70 p-3 flex flex-col gap-1 transition-colors hover:border-(--terminal-accent)/40"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-(--terminal-accent) font-bold">{puzzle.code}</span>
                        <span className="text-(--terminal-muted) text-[10px]">{puzzle.label}</span>
                      </div>
                      <p className="text-[10px] text-(--terminal-muted) leading-tight">
                        {puzzle.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="group mt-1 inline-flex items-center gap-2 rounded-lg border border-(--terminal-accent)/40 bg-(--terminal-accent)/10 text-(--terminal-accent) font-semibold px-6 py-2.5 text-xs sm:text-sm hover:bg-(--terminal-accent)/20 transition-colors cursor-pointer select-none"
                >
                  $ gate --enter-challenges
                  <ShieldAlert
                    size={14}
                    className="transition-transform duration-200 group-hover:rotate-12"
                  />
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
