import { Metadata } from "next";
import { type JSX, type ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terminal Gate",
  robots: { index: false, follow: false },
};

export default function GateLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="min-h-screen bg-black font-mono text-green-400 selection:bg-green-400/20">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="relative mx-auto max-w-3xl px-4 py-10">{children}</div>
    </div>
  );
}
