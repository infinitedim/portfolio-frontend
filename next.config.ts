const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  reactStrictMode: true,
  reactCompiler: !isDev,
  typedRoutes: true,
  serverExternalPackages: ["bcryptjs"],

  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    typedEnv: true,
    optimizePackageImports: [
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-icons",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
      "recharts",
    ],
  },
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.ts",
    },
  },
  images: {
    loader: "default",
    formats: ["image/avif", "image/webp"],
    ...(isDev
      ? {}
      : {
          deviceSizes: [640, 750, 828, 1080, 1200],
          imageSizes: [16, 32, 48, 64, 96, 128],
        }),
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: false,
    contentDispositionType: "inline",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  compress: !isDev,
  poweredByHeader: false,
  generateEtags: !isDev,
  compiler: {
    removeConsole: !isDev
      ? {
          exclude: ["error", "warn"],
        }
      : false,
    reactRemoveProperties: !isDev,
    styledComponents: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  ...(isDev
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                {
                  key: "X-DNS-Prefetch-Control",
                  value: "on",
                },
                {
                  key: "X-Content-Type-Options",
                  value: "nosniff",
                },
                {
                  key: "X-Frame-Options",
                  value: "DENY",
                },
                {
                  key: "Referrer-Policy",
                  value: "strict-origin-when-cross-origin",
                },
                {
                  key: "Permissions-Policy",
                  value:
                    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()",
                },
                {
                  key: "Cross-Origin-Embedder-Policy",
                  value: "credentialless",
                },
                {
                  key: "Cross-Origin-Opener-Policy",
                  value: "same-origin",
                },
                {
                  key: "Cross-Origin-Resource-Policy",
                  value: "same-origin",
                },
                {
                  key: "X-Permitted-Cross-Domain-Policies",
                  value: "none",
                },
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ],
            },
            {
              source: "/sw.js",
              headers: [
                {
                  key: "Service-Worker-Allowed",
                  value: "/",
                },
                {
                  key: "Cache-Control",
                  value: "public, max-age=0, must-revalidate",
                },
              ],
            },
            {
              source: "/:path*\\.(ico|png|jpg|jpeg|gif|webp|svg|css|js)",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ];
        },
      }),

  redirects: isDev
    ? undefined
    : async () => [
        {
          source: "/home",
          destination: "/",
          permanent: true,
        },
        {
          source: "/terminal",
          destination: "/",
          permanent: true,
        },
      ],
};

let finalConfig = nextConfig;

if (process.env.ANALYZE === "true") {
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: true,
    openAnalyzer: true,
  });
  finalConfig = withBundleAnalyzer(nextConfig);
}

export default finalConfig as import("next").NextConfig;
