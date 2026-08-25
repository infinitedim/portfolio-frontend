import { Metadata } from "next";
import { type JSX, type ReactNode } from "react";

/**
 * Metadata configuration for Gate Level 1 (Natas 0) specifying page title and search robot indexing rules.
 */
export const metadata: Metadata = {
  title: "Gate — Natas 0",
  robots: { index: false, follow: false },
};

/**
 * Layout wrapper component for the Gate Level 1 (Natas 0) challenge stage.
 *
 * @param {Object} props - Component properties.
 * @param {ReactNode} props.children - Child elements to be rendered within the layout.
 * @returns {JSX.Element} The rendered React layout wrapper fragment.
 */
export default function GateLevel1Layout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return <>{children}</>;
}
