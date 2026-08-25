import { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense, type JSX } from "react";
import { getGateUnlockedFromBackend } from "@/lib/gate/gate-server";
import { TerminalLockedTeaser } from "../../components/organisms/gate/terminal-locked-teaser";
import { TerminalUnlockedContent } from "../../components/organisms/gate/terminal-unlocked-content";

/**
 * Route metadata configuration for the Terminal page.
 *
 * @description
 * Sets up SEO metadata, OpenGraph tags, Twitter cards, robots directives,
 * and canonical URL configuration for the interactive developer terminal portfolio page.
 */
export const metadata: Metadata = {
  title: "Terminal Portfolio | Full-Stack Developer",
  description:
    "Interactive developer portfolio with terminal interface. Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Terminal Portfolio | Full-Stack Developer",
    description:
      "Interactive developer portfolio with terminal interface. Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies.",
    type: "website",
    url: "/terminal",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Terminal Portfolio - Interactive Developer Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terminal Portfolio | Full-Stack Developer",
    description:
      "Interactive developer portfolio with terminal interface. Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/terminal",
  },
};

/**
 * Checks whether the terminal access gate feature is enabled via environment variables.
 *
 * @description
 * Evaluates the `NEXT_PUBLIC_GATE_ENABLED` environment variable to determine if gate protection
 * should be enforced. Returns `true` unless explicitly set to `'false'`.
 *
 * @returns {boolean} `true` if the gate is enabled or unset, `false` otherwise.
 */
function isGateEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GATE_ENABLED !== "false";
}

/**
 * Server component that verifies gate access state and renders appropriate terminal content.
 *
 * @description
 * Asynchronously inspects incoming request cookies and validates gate authorization
 * against the backend service. Renders `<TerminalLockedTeaser />` if locked or unauthorized,
 * or `<TerminalUnlockedContent />` if unlocked.
 *
 * @returns {Promise<JSX.Element>} Promise resolving to the gate teaser or unlocked terminal component.
 */
async function TerminalGateContent(): Promise<JSX.Element> {
  const cookieStore = await cookies();
  const unlocked = await getGateUnlockedFromBackend(cookieStore.toString());

  if (!unlocked) {
    return <TerminalLockedTeaser />;
  }

  return <TerminalUnlockedContent />;
}

/**
 * Terminal page route component.
 *
 * @description
 * Entry point for the `/terminal` route. If the gate feature is disabled, it directly renders
 * the unlocked terminal interface. When gate is enabled, wraps `TerminalGateContent` in a
 * React `Suspense` boundary with `TerminalLockedTeaser` as fallback.
 *
 * @returns {JSX.Element} The rendered terminal page element.
 */
export default function TerminalPage(): JSX.Element {
  if (!isGateEnabled()) {
    return <TerminalUnlockedContent />;
  }

  return (
    <Suspense fallback={<TerminalLockedTeaser />}>
      <TerminalGateContent />
    </Suspense>
  );
}

