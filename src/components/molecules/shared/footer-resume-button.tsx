"use client";

import { JSX, useState } from "react";
import { TurnstileResumeModal } from "@/components/molecules/shared/turnstile-resume-modal";

/**
 * FooterResumeButton component renders a trigger button in the footer that opens
 * a Cloudflare Turnstile-protected modal for downloading or viewing the developer resume.
 *
 * Manages local modal open state and toggles the Turnstile verification dialog on user click.
 *
 * @returns A React fragment containing the resume trigger button and modal dialog.
 */
export function FooterResumeButton(): JSX.Element {
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
