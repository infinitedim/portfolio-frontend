"use client";

import { useState } from "react";
import { TurnstileResumeModal } from "@/components/molecules/shared/turnstile-resume-modal";

export function AboutResumeButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        data-cursor-text="DOWNLOAD"
        suppressHydrationWarning
        className="rounded bg-green-400 px-5 py-2.5 font-mono text-sm font-medium text-neutral-950 transition-colors hover:bg-green-300 cursor-pointer"
      >
        ↓ Download Resume
      </button>
      <TurnstileResumeModal isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
