"use client";

import { useRouter } from "next/navigation";
import { type JSX, useState } from "react";
import { TerminalFeaturesModal } from "@/components/molecules/shared/terminal-features-modal";

export function TerminalCta(): JSX.Element {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="border-t border-neutral-800 px-4 py-16">
      <div className="mx-auto max-w-4xl rounded-lg border border-green-400/20 bg-green-400/5 p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-green-400/70">
          NATAS-style gate
        </p>
        <h2 className="mt-3 font-mono text-2xl font-bold text-white">
          Unlock the terminal
        </h2>
        <p className="mx-auto mt-4 max-w-lg font-mono text-sm text-neutral-400">
          Three NATAS-style web puzzles — static login, hidden paths, and a
          Referer header check — stand between you and the interactive CLI.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-6 inline-block rounded border border-green-400 bg-green-400/10 px-6 py-2.5 font-mono text-sm text-green-400 transition-colors hover:bg-green-400/20 cursor-pointer"
        >
          Enter the gate →
        </button>
      </div>

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
