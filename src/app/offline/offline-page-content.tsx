"use client";

import { useState, useEffect, useCallback, type JSX } from "react";
import Link from "next/link";
import { useI18n } from "@/hooks/use-i18n";
import { OfflineRadar } from "@/components/organisms/offline/offline-radar";

export function OfflinePageContent(): JSX.Element {
  const { t } = useI18n();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [enableCrt, setEnableCrt] = useState(true);

  // Monitor network online/offline events
  const handleOnlineStatus = useCallback(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      window.addEventListener("online", handleOnlineStatus);
      window.addEventListener("offline", handleOnlineStatus);
      return () => {
        window.removeEventListener("online", handleOnlineStatus);
        window.removeEventListener("offline", handleOnlineStatus);
      };
    }
  }, [handleOnlineStatus]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-black px-4 py-8 font-mono text-neutral-200 overflow-x-hidden">
      {/* CRT Scanline Overlay */}
      {enableCrt && (
        <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-size-[100%_4px] opacity-40" />
      )}

      {/* Auto-Reconnect Banner Notice */}
      {isOnline && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border border-emerald-500/40 bg-emerald-950/90 px-4 py-2 text-xs text-emerald-300 shadow-2xl backdrop-blur-md animate-bounce">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>Network Signal Restored! You are back online.</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/30 transition-colors"
          >
            Reconnect Now
          </button>
        </div>
      )}

      <div className="w-full max-w-md space-y-6">
        {/* Top Header Title */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-3 py-1 text-xs text-neutral-400">
            <span
              className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-400" : "bg-amber-500 animate-pulse"}`}
            />
            <span>{t("offlineTitle")}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t("offlineTitle")}
          </h1>
          <p className="max-w-xs text-xs text-neutral-400 leading-relaxed">
            {t("offlineDescription")}
          </p>
        </div>

        {/* Central Signal Radar Component */}
        <OfflineRadar
          isOnline={isOnline}
          onRecheckSignal={handleOnlineStatus}
        />

        {/* Action Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-800/80 pt-4 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
            >
              {t("tryAgain")}
            </button>
            <Link
              href="/"
              className="rounded border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
            >
              {t("home")}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setEnableCrt((prev) => !prev)}
            className="text-[11px] text-neutral-500 hover:text-neutral-300"
          >
            CRT Scanlines: {enableCrt ? "[ON]" : "[OFF]"}
          </button>
        </div>
      </div>
    </main>
  );
}
