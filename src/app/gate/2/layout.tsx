import { Metadata } from "next";
import { type JSX, type ReactNode } from "react";

/**
 * SEO and robot indexation metadata for Level 2 of the gate challenge.
 */
export const metadata: Metadata = {
  title: "Gate — Natas 3",
  robots: { index: false, follow: false },
};

/**
 * Layout wrapper component for Level 2 of the gate challenge.
 *
 * @param props - Layout component properties.
 * @param props.children - Child components and pages to render within the layout.
 * @returns The JSX element wrapping child elements.
 */
export default function GateLevel2Layout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return <>{children}</>;
}
