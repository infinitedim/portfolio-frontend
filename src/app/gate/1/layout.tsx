import { Metadata } from "next";
import { type JSX, type ReactNode } from "react";

export const metadata: Metadata = {
  title: "Gate — Bandit",
  robots: { index: false, follow: false },
};

export default function GateLevel1Layout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return <>{children}</>;
}
