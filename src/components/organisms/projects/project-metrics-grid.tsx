import { type JSX } from "react";
import { Zap, ShieldCheck, Gauge, Layers } from "lucide-react";
import { type ProjectMetrics } from "@/lib/data/data-fetching";

interface ProjectMetricsGridProps {
  metrics?: ProjectMetrics;
  className?: string;
}

export function ProjectMetricsGrid({
  metrics,
  className = "",
}: ProjectMetricsGridProps): JSX.Element {
  // Monorepo SLA defaults (validated against portfolio-backend/docs/performance/API_SLA.md & FEATURE_33_PERFORMANCE.md)
  const latency = metrics?.latencyP95 ?? "< 35ms";
  const coverage = metrics?.testCoverage ?? "94%";
  const lighthouse = metrics?.lighthouseScore ?? 100;
  const architecture = metrics?.architectureType ?? "Rust / Axum / PPR";

  const cards = [
    {
      id: "latency",
      label: "P95 API SLA",
      value: latency,
      subtitle: "Verified Response SLA",
      icon: Zap,
      iconColor: "text-emerald-400",
      glowColor: "shadow-[0_0_12px_rgba(52,211,153,0.25)]",
    },
    {
      id: "coverage",
      label: "Test Coverage",
      value: coverage,
      subtitle: "CI LCOV Test Suite",
      icon: ShieldCheck,
      iconColor: "text-emerald-400",
      glowColor: "shadow-[0_0_12px_rgba(52,211,153,0.25)]",
    },
    {
      id: "lighthouse",
      label: "Lighthouse Score",
      value: `${lighthouse}/100`,
      subtitle: "Perf, A11y & SEO Vitals",
      icon: Gauge,
      iconColor: "text-emerald-400",
      glowColor: "shadow-[0_0_12px_rgba(52,211,153,0.25)]",
    },
    {
      id: "architecture",
      label: "Architecture",
      value: architecture,
      subtitle: "Monorepo Tech Engine",
      icon: Layers,
      iconColor: "text-emerald-400",
      glowColor: "shadow-[0_0_12px_rgba(52,211,153,0.25)]",
    },
  ];

  return (
    <section
      aria-label="Key Engineering Metrics"
      className={`py-6 ${className}`}
    >
      <h2 className="mb-4 font-mono text-xl font-bold text-white">
        <span className="text-emerald-400">$</span> metrics --benchmark
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 lg:gap-6">
        {cards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.id}
              className="group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-neutral-900/80 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]"
            >
              {/* Top hover accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-emerald-500/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-neutral-400">
                  {card.label}
                </span>
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-neutral-800 bg-neutral-950/80 ${card.iconColor} transition-transform duration-300 group-hover:scale-110 group-hover:border-emerald-500/30`}
                >
                  <IconComponent
                    size={14}
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="mt-3">
                <span className="block font-mono text-xl sm:text-2xl font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.35)] transition-all duration-200 group-hover:text-emerald-300 truncate">
                  {card.value}
                </span>
                <p className="mt-1 font-mono text-[11px] text-neutral-500 transition-colors duration-200 group-hover:text-neutral-400">
                  {card.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
