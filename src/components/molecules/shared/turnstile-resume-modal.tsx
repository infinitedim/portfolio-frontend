"use client";

import { useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Turnstile } from "@marsidev/react-turnstile";
import { Download, ShieldCheck, X, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * Properties for the TurnstileResumeModal component.
 *
 * @interface TurnstileResumeModalProps
 * @property {boolean} isOpen - Controls whether the modal dialog is visible.
 * @property {(open: boolean) => void} onOpenChange - Callback invoked when the modal visibility state changes.
 */
interface TurnstileResumeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Security verification modal integrating Cloudflare Turnstile CAPTCHA protection
 * for authorized resume PDF downloads with fallback mechanisms.
 *
 * @param {TurnstileResumeModalProps} props - Component properties.
 * @param {boolean} props.isOpen - Current visibility state of the modal.
 * @param {(open: boolean) => void} props.onOpenChange - Callback invoked when visibility changes.
 * @returns {JSX.Element} The rendered modal containing the Turnstile challenge and download handler.
 */
export function TurnstileResumeModal({
  isOpen,
  onOpenChange,
}: TurnstileResumeModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [hasFailed, setHasFailed] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY || "";

  /**
   * Dispatches a POST request to verify the Turnstile token and initiate resume file download.
   *
   * @param {string} [token] - Optional Turnstile validation token provided by the challenge response.
   * @returns {Promise<void>} Resolves when download initiates or fails.
   */
  const handleDownloadWithToken = useCallback(
    async (token?: string) => {
      setIsDownloading(true);
      setErrorMsg(null);

      try {
        const response = await fetch("/api/resume/download", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error || "Download failed. Please try again.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Dimas_Saputra_Resume.pdf";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success("Resume downloaded successfully!");
        onOpenChange(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "An error occurred";
        setErrorMsg(msg);
        toast.error(msg);
      } finally {
        setIsDownloading(false);
      }
    },
    [onOpenChange],
  );

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setHasFailed(false);
          setErrorMsg(null);
        }
        onOpenChange(open);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in" />
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <Dialog.Content className="relative w-full max-w-md rounded-t-2xl sm:rounded-xl border-t sm:border border-neutral-800 bg-neutral-950 p-6 pb-8 sm:pb-6 shadow-2xl focus:outline-none font-mono animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <div
              className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-800 sm:hidden"
              aria-hidden="true"
            />
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2 text-green-400">
                <ShieldCheck className="h-5 w-5" />
                <Dialog.Title className="text-base font-bold text-neutral-100">
                  Security Check
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-4 text-xs text-neutral-400 leading-relaxed">
              Please complete the Cloudflare security verification below to
              access and download Dimas Saputra&apos;s Resume.
            </Dialog.Description>
            <div className="my-6 flex flex-col items-center justify-center min-h-35 rounded-lg border border-neutral-900 bg-neutral-900/50 p-4">
              {isDownloading ? (
                <div className="flex flex-col items-center gap-2 text-green-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs">Preparing download...</span>
                </div>
              ) : siteKey && !hasFailed ? (
                <div className="flex flex-col items-center gap-3">
                  <Turnstile
                    siteKey={siteKey}
                    onSuccess={(token: string) => handleDownloadWithToken(token)}
                    onError={() => {
                      setHasFailed(true);
                      setErrorMsg(
                        "Security verification service unavailable. You can download directly below.",
                      );
                    }}
                    options={{
                      theme: "dark",
                      size: "normal",
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className="text-xs text-neutral-400">
                    {hasFailed
                      ? "Security verification skipped."
                      : "Turnstile verification inactive."}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadWithToken()}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-500 hover:bg-green-400 text-neutral-950 px-4 py-2 text-xs font-bold transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF directly
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center text-[10px] text-neutral-500 border-t border-neutral-900 pt-3">
              <span>Protected by Cloudflare Turnstile</span>
              <span>100% Bot Safe</span>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
