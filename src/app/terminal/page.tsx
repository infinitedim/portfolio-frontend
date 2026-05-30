import { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense, type JSX } from "react";
import { getGateUnlockedFromBackend } from "@/lib/gate/gate-server";
import { TerminalLockedTeaser } from "../../components/organisms/gate/terminal-locked-teaser";
import { TerminalUnlockedContent } from "../../components/organisms/gate/terminal-unlocked-content";

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

function isGateEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GATE_ENABLED !== "false";
}

async function TerminalGateContent(): Promise<JSX.Element> {
  const cookieStore = await cookies();
  const unlocked = await getGateUnlockedFromBackend(cookieStore.toString());

  if (!unlocked) {
    return <TerminalLockedTeaser />;
  }

  return <TerminalUnlockedContent />;
}

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
