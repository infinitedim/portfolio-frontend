import type { Metadata } from "next";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { PageHeader } from "@/components/atoms/shared/page-header";
import { NewsletterSignup } from "@/components/molecules/newsletter/newsletter-signup";
import { Cpu, Terminal, Shield, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Newsletter | Developer Dispatch",
  description: "Subscribe to engineering breakdowns, Rust/Axum architecture notes, and Next.js 16 updates.",
};

const MODULES = [
  {
    id: "MOD_01",
    title: "Rust & Axum High-Performance Systems",
    desc: "Deep-dives into memory-safe backend services, async tokio runtimes, and low-latency API engineering.",
    icon: Cpu,
  },
  {
    id: "MOD_02",
    title: "Next.js 16 & Modern Web Architecture",
    desc: "Partial Prerendering (PPR), React Server Components, custom editors, and Web Vitals optimization.",
    icon: Terminal,
  },
  {
    id: "MOD_03",
    title: "Security, NATAS Gates & Pen-Testing",
    desc: "Web security principles, authentication protocols, rate limiting, and defensive engineering patterns.",
    icon: Shield,
  },
  {
    id: "MOD_04",
    title: "GCP Infrastructure & Observability",
    desc: "Terraform IaC, Cloud Run serverless VPC, Prometheus metrics, and Grafana SLO alerting.",
    icon: Zap,
  },
];

export default function NewsletterPage() {
  return (
    <StandardPageLayout>
      <div className="min-h-screen bg-terminal-bg text-terminal-text py-12 px-4">
        <div className="mx-auto max-w-5xl space-y-12">
          {/* Header */}
          <PageHeader
            title="newsletter"
            description="Direct developer dispatch. Technical articles, architectural breakdowns, and engineering notes sent straight to your inbox."
          />

          {/* Module Topics Grid */}
          <section className="space-y-4">
            <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400">$</span>
              <span>list --modules</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODULES.map((mod) => {
                const IconComponent = mod.icon;
                return (
                  <div
                    key={mod.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 transition-colors hover:border-emerald-400/40"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        [{mod.id}]
                      </span>
                      <IconComponent className="w-5 h-5 text-neutral-400" />
                    </div>
                    <h3 className="font-mono text-base font-bold text-white mb-2">
                      {mod.title}
                    </h3>
                    <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Newsletter Terminal Window Box */}
          <section className="relative rounded-2xl border border-neutral-800 bg-neutral-900/70 p-8 sm:p-12 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0" />

            <div className="max-w-xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>broadcast.status :: active</span>
              </div>

              <h3 className="font-mono text-xl sm:text-2xl font-bold text-white tracking-tight">
                $ newsletter --subscribe
              </h3>

              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                Zero spam. Double opt-in verification. Unsubscribe anytime with a single click.
              </p>

              <div className="pt-2 flex justify-center">
                <NewsletterSignup />
              </div>
            </div>
          </section>
        </div>
      </div>
    </StandardPageLayout>
  );
}
