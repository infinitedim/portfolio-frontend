import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import type { JSX, ReactNode } from "react";
import "./globals.css";
import { ThemeInitScript } from "@/components/layout/theme-init-script";
import { AccessibilityProvider } from "../components/organisms/accessibility/accessibility-provider";
import { ScreenReaderAnnouncer } from "../components/molecules/accessibility/screen-reader-announcer";
import { ClientOnlyComponents } from "../components/layout/client-only-components";
import { LenisProvider } from "@/components/layout/lenis-provider";

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
        {/* TODO: Upload avatar photo as public/avatar.jpg — currently missing, causes 404 in JSON-LD Rich Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Dimas Saputra",
              url: "https://infinitedim.dev",
              image: "https://infinitedim.dev/avatar.jpg",
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
        <ClientOnlyComponents />
        <AccessibilityProvider>
          <ScreenReaderAnnouncer message="Terminal Portfolio" />
          <LenisProvider>{children}</LenisProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
