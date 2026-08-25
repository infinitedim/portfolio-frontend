import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import type { JSX, ReactNode } from "react";
import "./globals.css";
import { ThemeInitScript } from "@/components/layout/theme-init-script";
import { AccessibilityProvider } from "../components/organisms/accessibility/accessibility-provider";
import { ScreenReaderAnnouncer } from "../components/molecules/accessibility/screen-reader-announcer";
import { ClientOnlyComponents } from "../components/layout/client-only-components";
import { LenisProvider } from "@/components/layout/lenis-provider";
import { CursorProvider, CustomCursor } from "@/components/organisms/cursor";
import { UnlockedCustomizationProvider } from "@/components/layout/unlocked-customization-provider";

/**
 * JetBrains Mono font configuration for terminal-style typography across the application.
 *
 * @description
 * Loads the Latin character subset with variable font weight definitions
 * and binds the font family to the `--font-mono` CSS custom property.
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

/**
 * Global viewport configuration for responsive layout rendering.
 *
 * @description
 * Defines mobile responsive scaling boundaries, accessibility zoom allowances,
 * and adaptive browser theme colors for dark and light color schemes.
 */
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

/**
 * Global application metadata configuration for search engine optimization (SEO) and social previews.
 *
 * @description
 * Configures base URL resolution, default title templates, meta descriptions, developer keywords,
 * OpenGraph and Twitter card parameters, search engine robot indexing directives, site verifications,
 * progressive web app (PWA) manifest references, and Apple Web App settings.
 */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://infinitedim.dev",
  ),
  title: {
    default: "Dimas Saputra | Full-Stack Developer",
    template: "%s | Dimas Saputra",
  },
  description:
    "Full-stack developer portfolio — projects, blog, and interactive terminal. React, Next.js, TypeScript, and modern web technologies.",
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
  authors: [{ name: "Dimas Saputra", url: "https://infinitedim.dev" }],
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
    siteName: "Dimas Saputra",
    title: "Dimas Saputra | Full-Stack Developer",
    description:
      "Full-stack developer portfolio — projects, blog, and interactive terminal.",
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
    title: "Dimas Saputra | Full-Stack Developer",
    description:
      "Full-stack developer portfolio — projects, blog, and interactive terminal.",
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
  process.env.BING_VERIFICATION
    ? {
        verification: {
          ...(process.env.GOOGLE_SITE_VERIFICATION
            ? { google: process.env.GOOGLE_SITE_VERIFICATION }
            : {}),
          ...(process.env.YANDEX_VERIFICATION
            ? { yandex: process.env.YANDEX_VERIFICATION }
            : {}),
        },
      }
    : {}),
  alternates: {
    canonical: "/",
    languages: {
      en: "/?locale=en",
      id: "/?locale=id",
    },
  },
  category: "technology",
  classification: "Developer Portfolio",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Portfolio Terminal",
  },
  other: {
    "msvalidate.01": process.env.BING_VERIFICATION || "",
    "msapplication-TileColor": "#000000",
    "theme-color": "#000000",
    "msapplication-config": "/browserconfig.xml",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Portfolio",
    "mobile-web-app-capable": "yes",
  },
};

/**
 * Root HTML layout component for the portfolio web application.
 *
 * @description
 * Establishes the foundational document shell, applying language attributes,
 * CSS font variable classes, hydration suppression, inline theme initialization scripts,
 * structured JSON-LD schemas (Person and WebSite), and nesting global state/UI providers:
 * {@link UnlockedCustomizationProvider}, {@link ClientOnlyComponents},
 * {@link AccessibilityProvider}, {@link LenisProvider}, and {@link CursorProvider}.
 *
 * @param {object} props - Component properties.
 * @param {ReactNode} props.children - The page components and sub-layouts to render within the document body.
 * @returns {JSX.Element} The rendered root `<html>` and `<body>` layout container.
 */
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <meta name="format-detection" content="telephone=no" />
        <link rel="icon" href="/avatar.jpg" />
        <link rel="apple-touch-icon" href="/avatar.jpg" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Dimas Saputra",
              alternateName: ["infinitedim"],
              url: "https://infinitedim.dev",
              image: "https://infinitedim.dev/avatar.jpg",
              jobTitle: "Full-Stack Developer",
              worksFor: {
                "@type": "Organization",
                name: "Freelance",
              },
              sameAs: [
                "https://github.com/infinitedim",
                "https://linkedin.com/in/infinitedim",
                "https://twitter.com/infinitedim",
              ],
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
              name: "Dimas Saputra Portfolio",
              url: "https://infinitedim.dev",
              description:
                "Full-stack developer portfolio — projects, blog, and interactive terminal.",
              author: {
                "@type": "Person",
                name: "Dimas Saputra",
              },
            }),
          }}
        />

        <ThemeInitScript />
      </head>
      <body className={"antialiased bg-background text-foreground"}>
        <UnlockedCustomizationProvider>
          <ClientOnlyComponents />
          <AccessibilityProvider>
            <ScreenReaderAnnouncer message="Terminal Portfolio" />
            <LenisProvider>
              <CursorProvider>
                {children}
                <CustomCursor />
              </CursorProvider>
            </LenisProvider>
          </AccessibilityProvider>
        </UnlockedCustomizationProvider>
      </body>
    </html>
  );
}
