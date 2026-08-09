"use client";

import { useEffect, useState, useCallback, type JSX } from "react";
import { useTheme } from "@/hooks/use-theme";

interface OfflineRadarProps {
  isOnline: boolean;
  onRecheckSignal?: () => void;
}

export function OfflineRadar({
  isOnline,
  onRecheckSignal,
}: OfflineRadarProps): JSX.Element {
  const { themeConfig } = useTheme();
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const measureLatency = useCallback(async () => {
    setIsChecking(true);
    const start = performance.now();
    try {
      if (typeof window !== "undefined" && navigator.onLine) {
        await fetch("/manifest.json", { method: "HEAD", cache: "no-store" });
        const latency = Math.round(performance.now() - start);
        setPingLatency(latency);
      } else {
        setPingLatency(null);
      }
    } catch {
      setPingLatency(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    measureLatency();
    const interval = setInterval(measureLatency, 5000);
    return () => clearInterval(interval);
  }, [measureLatency]);

  const primaryColor = isOnline ? "#10b981" : themeConfig.colors.accent;

  return (
    <div className="relative flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-800 bg-neutral-950/80 backdrop-blur-sm shadow-2xl">
      {/* Radar Canvas / SVG Sweep */}
      <div className="relative h-44 w-44 flex items-center justify-center">
        {/* Concentric Circles */}
        <div className="absolute inset-0 rounded-full border border-green-500/20 animate-pulse" />
        <div className="absolute inset-4 rounded-full border border-green-500/30" />
        <div className="absolute inset-10 rounded-full border border-green-500/20" />
        <div className="absolute inset-16 rounded-full border border-green-500/10" />

        {/* Crosshair Lines */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-green-500/20" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-green-500/20" />

        {/* Sweeping Beam */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none origin-center animate-spin"
          style={{
            animationDuration: "4s",
            background: `conic-gradient(from 0deg, transparent 0deg 300deg, ${primaryColor}40 360deg)`,
          }}
        />

        {/* Blip Signal Dots */}
        <div
          className={`h-3 w-3 rounded-full transition-all duration-300 ${
            isOnline
              ? "bg-emerald-400 shadow-[0_0_12px_#10b981] animate-ping"
              : "bg-amber-500 shadow-[0_0_12px_#f59e0b]"
          }`}
        />
      </div>

      {/* Connection Info Panel */}
      <div className="mt-4 flex flex-col items-center gap-1.5 text-center font-mono">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
          <span className="text-xs uppercase tracking-widest font-semibold text-neutral-200">
            {isOnline ? "SIGNAL ESTABLISHED" : "SIGNAL LOST (OFFLINE)"}
          </span>
        </div>

        <p className="text-[11px] text-neutral-400">
          {isOnline
            ? `Latency: ${pingLatency !== null ? `${pingLatency}ms` : "checking..."}`
            : "No active network response. Retrying gateway..."}
        </p>

        <button
          type="button"
          onClick={() => {
            measureLatency();
            onRecheckSignal?.();
          }}
          disabled={isChecking}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 transition-all hover:border-neutral-500 hover:text-white disabled:opacity-50"
        >
          <svg
            className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isChecking ? "Pinging..." : "Recheck Signal"}
        </button>
      </div>
    </div>
  );
}
