import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import type { JSX, ReactNode } from "react";
import { AuthProvider } from "../lib/auth";
import { AccessibilityProvider } from "../components/organisms/accessibility/accessibility-provider";
import { ScreenReaderAnnouncer } from "../components/molecules/accessibility/screen-reader-announcer";
import { ClientOnlyComponents } from "../components/layout/client-only-components";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#ffffff" },
  ],
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://infinitedim.vercel.app",
  ),
  title: {
    default: "Terminal Portfolio | Full-Stack Developer",
    template: "%s | Terminal Portfolio",
  },
  description:
    "Interactive developer portfolio with terminal interface. Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies. Explore projects, skills, and experience through an innovative terminal interface.",
  keywords: [
    "full-stack developer",
    "react developer",
    "nextjs developer",
    "typescript developer",
    "web developer portfolio",
    "terminal portfolio",
    "interactive portfolio",
    "modern web development",
    "frontend developer",
    "backend developer",
    "javascript developer",
    "node.js developer",
    "flutter developer",
    "flutter developer portfolio",
    "flutter web developer",
    "flutter web developer portfolio",
  ],
  authors: [{ name: "Dimas Saputra", url: "https://infinitedim.vercel.app" }],
  creator: "Dimas Saputra",
  publisher: "Dimas Saputra",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Terminal Portfolio",
    title: "Terminal Portfolio | Full-Stack Developer",
    description:
      "Interactive developer portfolio with terminal interface. Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Terminal Portfolio - Interactive Developer Portfolio",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@yourblooo",
    creator: "@yourblooo",
    title: "Terminal Portfolio | Full-Stack Developer",
    description:
      "Interactive developer portfolio with terminal interface. Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION ||
    process.env.YANDEX_VERIFICATION ||
    process.env.YAHOO_VERIFICATION
    ? {
      verification: {
        ...(process.env.GOOGLE_SITE_VERIFICATION
          ? { google: process.env.GOOGLE_SITE_VERIFICATION }
          : {}),
        ...(process.env.YANDEX_VERIFICATION
          ? { yandex: process.env.YANDEX_VERIFICATION }
          : {}),
        ...(process.env.YAHOO_VERIFICATION
          ? { yahoo: process.env.YAHOO_VERIFICATION }
          : {}),
      },
    }
    : {}),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
    },
  },
  category: "technology",
  classification: "Developer Portfolio",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Portfolio Terminal",
    startupImage: [
      {
        url: "/icons/apple-splash-2048-2732.png",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/icons/apple-splash-1668-2388.png",
        media:
          "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
    ],
  },
  other: {
    "msapplication-TileColor": "#000000",
    "theme-color": "#000000",
    "msapplication-config": "/browserconfig.xml",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Portfolio",
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <html
      lang="en"
      className={`antialiased ${jetbrainsMono.variable}`}
      suppressHydrationWarning={true}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Dimas Saputra",
              url: "https://infinitedim.vercel.app",
              image: "https://infinitedim.vercel.app/avatar.jpg",
              sameAs: [
                "https://github.com/infinitedim",
                "https://linkedin.com/in/infinitedim",
                "https://twitter.com/yourblooo",
              ],
              jobTitle: "Full-Stack Developer",
              worksFor: {
                "@type": "Organization",
                name: "Freelance",
              },
              knowsAbout: [
                "React",
                "Next.js",
                "TypeScript",
                "Node.js",
                "Web Development",
                "Full-Stack Development",
              ],
              description:
                "Full-stack developer specializing in React, Next.js, TypeScript, and modern web technologies.",
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Terminal Portfolio",
              url: "https://infinitedim.vercel.app",
              description:
                "Interactive developer portfolio with terminal interface",
              author: {
                "@type": "Person",
                name: "Dimas Saputra",
              },
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://infinitedim.vercel.app/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        <script src="/theme-init.js" />
      </head>
      <body className={"antialiased bg-background text-foreground"}>
        <ClientOnlyComponents />
        <AuthProvider>
          <AccessibilityProvider>
            <ScreenReaderAnnouncer message="Terminal Portfolio" />
            {children}
          </AccessibilityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
