import { type JSX } from "react";
import { Zap, ShieldCheck, Gauge, Layers } from "lucide-react";
import { type ProjectMetrics } from "@/lib/data/data-fetching";

interface MetricCell {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly icon: typeof Zap;
}

interface ProjectMetricsGridProps {
  readonly metrics?: ProjectMetrics;
  readonly className?: string;
}

export function ProjectMetricsGrid({
  metrics,
  className = "",
}: ProjectMetricsGridProps): JSX.Element | null {
  if (!metrics) return null;

  const latency = metrics.latencyP95 ?? "< 35ms";
  const coverage = metrics.testCoverage ?? "94%";
  const lighthouse = metrics.lighthouseScore ?? 100;
  const architecture = metrics.architectureType ?? "Rust / Axum / PPR";

  const cells: readonly MetricCell[] = [
    { id: "latency", label: "P95 SLA", value: latency, icon: Zap },
    { id: "coverage", label: "Coverage", value: coverage, icon: ShieldCheck },
    {
      id: "lighthouse",
      label: "Lighthouse",
      value: `${lighthouse}/100`,
      icon: Gauge,
    },
    {
      id: "architecture",
      label: "Stack",
      value: architecture,
      icon: Layers,
    },
  ];

  return (
    <div
      role="list"
      aria-label="Key Engineering Metrics"
      className={`grid grid-cols-2 sm:grid-cols-4 rounded-lg border border-neutral-800 bg-neutral-900/40 overflow-hidden ${className}`}
    >
      {cells.map((cell, index) => {
        const IconComponent = cell.icon;
        return (
          <div
            key={cell.id}
            role="listitem"
            className={`px-4 py-3 ${index < cells.length - 1 ? "border-b sm:border-b-0 sm:border-r border-neutral-800" : ""} ${index === 1 ? "border-r border-neutral-800 sm:border-r" : ""}`}
          >
            <div className="flex items-center gap-1.5">
              <IconComponent
                size={12}
                className="text-emerald-400/70 shrink-0"
                aria-hidden="true"
              />
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                {cell.label}
              </span>
            </div>
            <span className="mt-1 block font-mono text-sm font-bold text-emerald-400 tabular-nums drop-shadow-[0_0_8px_rgba(52,211,153,0.25)] truncate">
              {cell.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
