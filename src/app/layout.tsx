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
    process.env.NEXT_PUBLIC_BASE_URL || "https://infinitedim.site",
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
  authors: [{ name: "Dimas Saputra", url: "https://infinitedim.site" }],
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
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
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
        { }
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Dimas Saputra",
              url: "https://infinitedim.site",
              image: "https://infinitedim.site/avatar.jpg",
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

        { }
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Terminal Portfolio",
              url: "https://infinitedim.site",
              description:
                "Interactive developer portfolio with terminal interface",
              author: {
                "@type": "Person",
                name: "Dimas Saputra",
              },
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://infinitedim.site/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
  var THEMES={
    default:{bg:"#0a0a0a",text:"#e5e5e5",accent:"#00ff41",muted:"#666666",border:"#333333"},
    matrix:{bg:"#000000",text:"#00ff41",accent:"#00ff41",muted:"#008f11",border:"#00ff41"},
    cyberpunk:{bg:"#0f0f23",text:"#ff00ff",accent:"#00ffff",muted:"#666699",border:"#ff00ff"},
    dracula:{bg:"#282a36",text:"#f8f8f2",accent:"#bd93f9",muted:"#6272a4",border:"#44475a"},
    monokai:{bg:"#272822",text:"#f8f8f2",accent:"#a6e22e",muted:"#75715e",border:"#49483e"},
    solarized:{bg:"#002b36",text:"#839496",accent:"#268bd2",muted:"#586e75",border:"#073642"},
    gruvbox:{bg:"#282828",text:"#ebdbb2",accent:"#fabd2f",muted:"#928374",border:"#3c3836"},
    nord:{bg:"#2e3440",text:"#d8dee9",accent:"#88c0d0",muted:"#4c566a",border:"#3b4252"},
    tokyo:{bg:"#1a1b26",text:"#c0caf5",accent:"#7aa2f7",muted:"#565f89",border:"#292e42"},
    onedark:{bg:"#282c34",text:"#abb2bf",accent:"#61afef",muted:"#5c6370",border:"#3e4451"},
    catppuccin:{bg:"#1e1e2e",text:"#cdd6f4",accent:"#cba6f7",muted:"#6c7086",border:"#313244"},
    synthwave:{bg:"#2a0845",text:"#f92aad",accent:"#f97e72",muted:"#848bbd",border:"#495495"},
    vscode:{bg:"#1e1e1e",text:"#d4d4d4",accent:"#007acc",muted:"#808080",border:"#2d2d30"},
    github:{bg:"#0d1117",text:"#c9d1d9",accent:"#58a6ff",muted:"#8b949e",border:"#30363d"},
    terminal:{bg:"#000000",text:"#00ff00",accent:"#00ff00",muted:"#008000",border:"#00ff00"},
    hacker:{bg:"#000000",text:"#00ff00",accent:"#ff0000",muted:"#008000",border:"#00ff00"},
    neon:{bg:"#0a0a0a",text:"#ff10f0",accent:"#00ffff",muted:"#ff1493",border:"#ff10f0"},
    retro:{bg:"#2b1810",text:"#ffb000",accent:"#ff6600",muted:"#cc8800",border:"#ff6600"},
    minimal:{bg:"#fafafa",text:"#333333",accent:"#0066cc",muted:"#666666",border:"#e0e0e0"},
    ocean:{bg:"#0f1419",text:"#b3b1ad",accent:"#39bae6",muted:"#626a73",border:"#1f2430"},
    forest:{bg:"#1b2b1b",text:"#a7c080",accent:"#83c092",muted:"#7a8478",border:"#2d3d2d"}
  };
  function hexToHsl(hex){
    var r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
    var max=Math.max(r,g,b),min=Math.min(r,g,b),h=0,s=0,l=(max+min)/2;
    if(max!==min){var d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);
      h=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;h/=6;}
    return Math.round(h*360)+" "+Math.round(s*100)+"% "+Math.round(l*100)+"%";
  }
  var saved=localStorage.getItem("terminal-theme")||"default";
  var colors=THEMES[saved]||THEMES["default"];
  var root=document.documentElement;
  root.style.setProperty("--background",hexToHsl(colors.bg));
  root.style.setProperty("--foreground",hexToHsl(colors.text));
  root.style.setProperty("--terminal-bg",colors.bg);
  root.style.setProperty("--terminal-text",colors.text);
  root.style.setProperty("--terminal-accent",colors.accent);
  root.style.setProperty("--terminal-muted",colors.muted);
  root.style.setProperty("--terminal-border",colors.border);
  root.style.setProperty("--border",hexToHsl(colors.border));
  root.style.setProperty("--primary",hexToHsl(colors.accent));
  root.style.setProperty("--card",hexToHsl(colors.bg));
  root.style.setProperty("--card-foreground",hexToHsl(colors.text));
  root.style.setProperty("--muted",hexToHsl(colors.muted));
  root.style.setProperty("--accent",hexToHsl(colors.accent));
  root.style.setProperty("--popover",hexToHsl(colors.bg));
  root.style.setProperty("--popover-foreground",hexToHsl(colors.text));
}catch(e){}})();`,
          }}
        />
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
