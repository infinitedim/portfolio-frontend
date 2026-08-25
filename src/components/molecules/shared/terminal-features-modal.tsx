"use client";

import { useI18n } from "@/hooks/use-i18n";
import { type JSX, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";

/**
 * Props for the TerminalFeaturesModal component.
 */
interface TerminalFeaturesModalProps {
  /**
   * Controls whether the features modal dialog is currently open.
   */
  isOpen: boolean;
  /**
   * Callback invoked when the user cancels or closes the modal dialog.
   */
  onClose: () => void;
  /**
   * Callback invoked when the user confirms and proceeds to enter the interactive terminal.
   */
  onProceed: () => void;
}

/**
 * Represents a single highlighted feature item displayed inside the terminal features modal grid.
 */
interface Feature {
  /**
   * Optional React node or icon representing the feature visually.
   */
  icon?: ReactNode;
  /**
   * The localized title of the feature.
   */
  title: string;
  /**
   * The localized description explaining the feature capabilities.
   */
  desc: string;
}

/**
 * TerminalFeaturesModal component renders a modal dialog highlighting key terminal features
 * (roadmap tracking, theme engine, interactive demos, GitHub sync, PWA support, shell emulations).
 *
 * Implements Radix UI Dialog primitives with custom cyber/terminal styling, keyboard dismissal,
 * backdrop blur overlays, and localized text.
 *
 * @param props - Component configuration properties.
 * @param props.isOpen - Whether the modal dialog is actively open.
 * @param props.onClose - Dismissal callback function.
 * @param props.onProceed - Confirmation action callback function.
 * @returns A Radix Dialog portal JSX element or null.
 */
export function TerminalFeaturesModal({
  isOpen,
  onClose,
  onProceed,
}: TerminalFeaturesModalProps): JSX.Element | null {
  const { t } = useI18n();

  const title = t("terminalFeaturesTitle");
  const subtitle = t("terminalFeaturesSubtitle");
  const ctaProceed = t("terminalFeaturesCtaProceed");
  const ctaCancel = t("terminalFeaturesCtaCancel");

  const features: Feature[] = [
    {
      icon: undefined,
      title: t("terminalFeaturesRoadmapTitle"),
      desc: t("terminalFeaturesRoadmapDesc"),
    },
    {
      icon: undefined,
      title: t("terminalFeaturesThemeTitle"),
      desc: t("terminalFeaturesThemeDesc"),
    },
    {
      icon: undefined,
      title: t("terminalFeaturesDemoTitle"),
      desc: t("terminalFeaturesDemoDesc"),
    },
    {
      icon: undefined,
      title: t("terminalFeaturesGithubTitle"),
      desc: t("terminalFeaturesGithubDesc"),
    },
    {
      icon: undefined,
      title: t("terminalFeaturesPwaTitle"),
      desc: t("terminalFeaturesPwaDesc"),
    },
    {
      icon: undefined,
      title: t("terminalFeaturesShellTitle"),
      desc: t("terminalFeaturesShellDesc"),
    },
  ];

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <Dialog.Portal>
                        
        <Dialog.Overlay className="fixed inset-0 z-100 bg-black/75 backdrop-blur-sm transition-opacity" />

                                     
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <Dialog.Content className="relative w-full max-w-2xl rounded-lg border border-green-500/30 bg-neutral-950 p-1 shadow-[0_0_40px_rgba(34,197,94,0.15)] transition-all duration-300 md:max-w-2xl flex flex-col overflow-hidden max-h-[80vh] focus:outline-none">
                                                  
            <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 px-4 py-2.5 rounded-t-lg shrink-0">
              <div className="flex items-center gap-1.5">
                <Dialog.Close asChild>
                  <button
                    className="h-3 w-3 rounded-full bg-red-500/80 cursor-pointer border-0 p-0 focus:outline-none"
                    aria-label="Close features preview modal"
                  />
                </Dialog.Close>
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <Dialog.Title className="font-mono text-xs text-neutral-400 font-normal">
                features_manifest.json
              </Dialog.Title>
              <div className="w-12" />               
            </div>

                                                   
            <div className="px-6 pt-6 pb-4 border-b border-neutral-900 shrink-0">
              <h2 className="font-mono text-xl font-bold text-green-400 flex items-center gap-2">
                <span className="text-green-400 opacity-60 font-mono">~/</span>
                {title}
              </h2>
              <Dialog.Description className="mt-2 font-mono text-xs text-neutral-400 leading-relaxed">
                {subtitle}
              </Dialog.Description>
            </div>

                                            
            <div
              data-lenis-prevent
              className="flex-1 min-h-0 overflow-y-auto px-6 py-4 scrollbar-hide"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {features.map((feat, index) => (
                  <div
                    key={index}
                    className="rounded border border-neutral-800/40 bg-neutral-900/20 p-3 hover:border-green-500/20 hover:bg-green-500/5 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      {feat.icon && (
                        <span className="text-base select-none flex items-center justify-center">
                          {feat.icon}
                        </span>
                      )}
                      <h3 className="font-mono text-xs font-semibold text-white">
                        {feat.title}
                      </h3>
                    </div>
                    <p className="mt-1 font-mono text-[10px] leading-normal text-neutral-400">
                      {feat.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

                                          
            <div className="px-6 py-4 border-t border-neutral-900 bg-neutral-950/50 flex flex-col gap-2 shrink-0 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <button className="rounded border border-neutral-800 bg-neutral-950 px-4 py-2 font-mono text-xs text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer">
                  {ctaCancel}
                </button>
              </Dialog.Close>
              <button
                onClick={onProceed}
                className="rounded border border-green-500 bg-green-500/10 px-5 py-2 font-mono text-xs text-green-400 hover:bg-green-500/20 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all cursor-pointer"
              >
                {ctaProceed}
              </button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
