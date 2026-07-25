"use client";

import { useState } from "react";
import { TurnstileResumeModal } from "@/components/molecules/shared/turnstile-resume-modal";

export function FooterResumeButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="transition-colors hover:text-green-400 cursor-pointer font-mono text-xs text-neutral-400 bg-transparent border-0 p-0"
      >
        Resume
      </button>
      <TurnstileResumeModal isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
