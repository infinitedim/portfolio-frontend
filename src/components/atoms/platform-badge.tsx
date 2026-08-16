"use client";

import { type JSX } from "react";
import { type TargetPlatform } from "@/lib/data/data-fetching";
import { Smartphone, Apple, Monitor, Globe, Terminal, Laptop } from "lucide-react";

interface PlatformBadgeProps {
  readonly platform: TargetPlatform;
  readonly size?: "sm" | "md";
}

const PLATFORM_CONFIG: Record<
  TargetPlatform,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  android: {
    label: "Android",
    icon: Smartphone,
    color: "text-emerald-400 border-emerald-400/30 bg-emerald-950/30",
  },
  ios: {
    label: "iOS",
    icon: Apple,
    color: "text-neutral-200 border-neutral-700 bg-neutral-900/60",
  },
  windows: {
    label: "Windows",
    icon: Monitor,
    color: "text-sky-400 border-sky-400/30 bg-sky-950/30",
  },
  macos: {
    label: "macOS",
    icon: Laptop,
    color: "text-indigo-400 border-indigo-400/30 bg-indigo-950/30",
  },
  linux: {
    label: "Linux",
    icon: Terminal,
    color: "text-amber-400 border-amber-400/30 bg-amber-950/30",
  },
  web: {
    label: "Web",
    icon: Globe,
    color: "text-teal-400 border-teal-400/30 bg-teal-950/30",
  },
};

export function PlatformBadge({
  platform,
  size = "sm",
}: PlatformBadgeProps): JSX.Element {
  const config = PLATFORM_CONFIG[platform] || {
    label: platform,
    icon: Globe,
    color: "text-neutral-400 border-neutral-800 bg-neutral-900",
  };

  const Icon = config.icon;
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs gap-1" : "px-2.5 py-1 text-sm gap-1.5";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span
      className={`inline-flex items-center rounded border font-mono font-medium transition-colors ${config.color} ${sizeClasses}`}
    >
      <Icon className={iconSize} />
      <span>{config.label}</span>
    </span>
  );
}
