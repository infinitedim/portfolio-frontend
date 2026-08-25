import { Metadata } from "next";
import { type JSX, type ReactNode } from "react";

/**
 * Metadata configuration for Gate Level 3 (Natas 5 challenge).
 *
 * @description
 * Sets the browser document title for Level 3 and instructs search engine crawlers
 * not to index or follow links from this gate challenge route.
 */
export const metadata: Metadata = {
  title: "Gate — Natas 5",
  robots: { index: false, follow: false },
};

/**
 * Layout component for the Gate Level 3 challenge page.
 *
 * @description
 * Serves as the structural wrapper for Gate Level 3 routes, applying level-specific
 * metadata while rendering nested child routes and client components.
 *
 * @param {object} props - Component properties.
 * @param {ReactNode} props.children - The child elements to be rendered within the layout.
 * @returns {JSX.Element} The rendered React subtree wrapped in a fragment.
 */
export default function GateLevel3Layout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return <>{children}</>;
}
