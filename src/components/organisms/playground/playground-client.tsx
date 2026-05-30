"use client";

import dynamic from "next/dynamic";

const SandpackPlayground = dynamic(
  () =>
    import("@/components/organisms/playground/sandpack-playground").then(
      (mod) => ({
        default: mod.SandpackPlayground,
      }),
    ),
  {
    ssr: false,
    loading: () => (
      <div className="py-16 text-center text-gray-400">Loading playground…</div>
    ),
  },
);

export function PlaygroundClient() {
  return <SandpackPlayground />;
}
