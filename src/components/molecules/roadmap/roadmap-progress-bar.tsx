"use client";

interface RoadmapProgressBarProps {
  percentage?: number;
  totalSegments?: number;
  activeSegments?: number;
  showAscii?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function RoadmapProgressBar({
  percentage,
  totalSegments: customTotal,
  activeSegments: customActive,
  showAscii = true,
  className = "",
  size = "md",
  label,
}: RoadmapProgressBarProps) {
  let pct: number;
  let topicText: string;
  let displayTotal: number;
  let displayActive: number;

  if (
    typeof customTotal === "number" &&
    customTotal > 0 &&
    typeof customActive === "number"
  ) {
    pct = Math.round((customActive / customTotal) * 100);
    topicText = `[${customActive}/${customTotal} TOPICS]`;

    // For short topics (<= 15), use exact count so 5 topics = 5 LEDs.
    // For standard/large topic counts (> 15), scale to uniform 25 or 30 LEDs for identical block sizing.
    if (customTotal <= 15) {
      displayTotal = customTotal;
      displayActive = customActive;
    } else {
      displayTotal = size === "lg" ? 30 : 25;
      displayActive = Math.round((pct / 100) * displayTotal);
    }
  } else {
    pct = Math.max(0, Math.min(100, Math.round(percentage ?? 0)));
    displayTotal = size === "lg" ? 30 : 25;
    displayActive = Math.round((pct / 100) * displayTotal);
    topicText = `[${displayActive}/${displayTotal} LEDS]`;
  }

  const isComplete = pct >= 100;
  const isStarted = pct > 0;

  const heightClasses = {
    sm: "h-2",
    md: "h-2.5",
    lg: "h-3",
  };

  const getActiveStyle = () => {
    if (isComplete) {
      return "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)] border-emerald-300/40";
    }
    if (isStarted) {
      return "bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.4)] border-cyan-400/40";
    }
    return "bg-neutral-800/80 border-neutral-800";
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 font-mono ${className}`}>
      {showAscii && (
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="text-emerald-400">$</span>
            <span
              className={
                isComplete
                  ? "text-emerald-400"
                  : isStarted
                  ? "text-cyan-400"
                  : "text-neutral-400"
              }
            >
              {label || `${pct}% EXECUTED`}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400">{topicText}</span>
        </div>
      )}

      {/* Segmented Matrix LED Bar with Uniform Cell Sizing */}
      <div className="w-full flex items-center gap-1 p-1 rounded-lg bg-neutral-950 border border-neutral-800/80 shadow-inner overflow-hidden">
        {Array.from({ length: displayTotal }).map((_, idx) => {
          const isActive = idx < displayActive;
          return (
            <div
              key={idx}
              className={`flex-1 rounded-[1px] border transition-colors ${heightClasses[size]} ${
                isActive
                  ? getActiveStyle()
                  : "bg-neutral-900 border-neutral-800/50"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
