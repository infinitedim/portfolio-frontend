"use client";

import { useI18n } from "@/hooks/use-i18n";
import { type JSX, useEffect } from "react";

interface TerminalFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export function TerminalFeaturesModal({
  isOpen,
  onClose,
  onProceed,
}: TerminalFeaturesModalProps): JSX.Element | null {
  const { currentLocale } = useI18n();
  const isIndonesian = currentLocale?.startsWith("id") ?? false;

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = {
    title: isIndonesian
      ? "Fitur Terkunci Terminal"
      : "Terminal Features Locked",
    subtitle: isIndonesian
      ? "Terminal interaktif dibatasi oleh gerbang tantangan keamanan NATAS-style. Berikut adalah fitur eksklusif yang hanya dapat diakses di mode Terminal CLI:"
      : "The interactive terminal is gated behind a NATAS-style web security challenge. Here are the exclusive features that are only accessible within the CLI Terminal environment:",
    features: [
      {
        icon: "️",
        title: isIndonesian
          ? "Sinkronisasi Peta Jalan & Skill"
          : "Roadmap.sh & Skills Integration",
        desc: isIndonesian
          ? "Manajemen skill interaktif (`skills`), sinkronisasi langsung ke akun roadmap.sh, serta kemampuan memperbarui dan menandai kemajuan belajar secara real-time."
          : "Interactive skills tracking (`skills`), direct synchronization with roadmap.sh profiles, and real-time status updates for your educational path.",
      },
      {
        icon: "",
        title: isIndonesian
          ? "Ubah Tema & Font Berligatur"
          : "Theme & Ligature Typography Customizer",
        desc: isIndonesian
          ? "Kustomisasi penuh tampilan terminal dengan preset tema (Dracula, Monokai, Hacker, dll.) dan font developer berligatur (Fira Code, JetBrains Mono, Inconsolata)."
          : "Personalize the entire workspace command interface using theme presets (Dracula, Monokai, Hacker, etc.) and coding fonts with ligatures support.",
      },
      {
        icon: "",
        title: isIndonesian
          ? "Live Simulasi Demo Proyek"
          : "Interactive CLI Project Demos",
        desc: isIndonesian
          ? "Jalankan demo interaktif langsung dari dalam CLI (`demo`) untuk melihat alur kerja project secara visual dan interaktif."
          : "Simulate and run live project interactive walkthroughs directly inside the CLI (`demo`) for a hands-on experience.",
      },
      {
        icon: "",
        title: isIndonesian
          ? "Metrik GitHub & Kontribusi Real-time"
          : "Real-time GitHub Metrics Stream",
        desc: isIndonesian
          ? "Dapatkan statistik kontribusi, repositori terpopuler, dan analisis komit GitHub terbaru (`github`) langsung melalui stream terminal."
          : "Retrieve and stream live GitHub repository info, total contributions, and commit analyses directly within the command prompt.",
      },
      {
        icon: "",
        title: isIndonesian
          ? "Dasbor PWA & Mode Offline Mandiri"
          : "Standalone PWA & Connection Dashboard",
        desc: isIndonesian
          ? "Kontrol penuh Progressive Web App (`pwa`), cek instalasi lokal, serta kelola kapabilitas luring total agar portofolio tetap berjalan tanpa internet."
          : "Monitor service workers (`pwa`), verify offline capabilities, and check standalone installation features directly inside the shell environment.",
      },
      {
        icon: "",
        title: isIndonesian
          ? "Shell Linux dengan Toleransi Typo"
          : "Robust Linux Shell & History Navigation",
        desc: isIndonesian
          ? "Navigasi keyboard penuh menggunakan arah panah (↑/↓) untuk riwayat perintah, toleransi typo cerdas, multi-alias, dan argumen flag baris perintah."
          : "Full keyboard-only experience with arrow navigation (↑/↓) for command logs, typo-tolerance algorithms, command flags parsing, and clear utilities.",
      },
    ],
    ctaProceed: isIndonesian
      ? "Mulai Tantangan Gate →"
      : "Start Gate Challenge →",
    ctaCancel: isIndonesian ? "Kembali" : "Cancel",
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClose();
          }
        }}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl rounded-lg border border-green-500/30 bg-neutral-950 p-1 shadow-[0_0_40px_rgba(34,197,94,0.15)] transition-all duration-300 md:max-w-2xl">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 px-4 py-2.5 rounded-t-lg">
          <div className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-full bg-red-500/80 cursor-pointer"
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onClose();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Close features preview modal"
            />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <span className="font-mono text-xs text-neutral-400">
            features_manifest.json
          </span>
          <div className="w-12" /> {/* Spacer */}
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-6 scrollbar-hide">
          <h2 className="font-mono text-xl font-bold text-green-400 flex items-center gap-2">
            <span className="text-green-400 opacity-60 font-mono">~/</span>
            {content.title}
          </h2>
          <p className="mt-2 font-mono text-xs text-neutral-400 leading-relaxed border-b border-neutral-900 pb-4">
            {content.subtitle}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {content.features.map((feat, index) => (
              <div
                key={index}
                className="rounded border border-neutral-800/40 bg-neutral-900/20 p-3 hover:border-green-500/20 hover:bg-green-500/5 transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base select-none">{feat.icon}</span>
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

          {/* Footer Actions */}
          <div className="mt-6 flex flex-col gap-2 border-t border-neutral-900 pt-4 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              className="rounded border border-neutral-800 bg-neutral-950 px-4 py-2 font-mono text-xs text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
            >
              {content.ctaCancel}
            </button>
            <button
              onClick={onProceed}
              className="rounded border border-green-500 bg-green-500/10 px-5 py-2 font-mono text-xs text-green-400 hover:bg-green-500/20 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all cursor-pointer"
            >
              {content.ctaProceed}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
