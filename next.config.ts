import path from "path";

const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  cacheComponents: true,
  reactStrictMode: true,
  reactCompiler: !isDev,
  typedRoutes: true,
  serverExternalPackages: ["bcryptjs"],
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    typedEnv: true,
    optimizePackageImports: [
      "@radix-ui/react-dialog",
      "lucide-react",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "date-fns",
      "@giscus/react",
      "framer-motion",
    ],
  },
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.ts",
      "../build/polyfills/polyfill-module": "./empty-module.ts",
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        "../build/polyfills/polyfill-module": path.resolve(__dirname, "./empty-module.ts"),
      };
    }
    return config;
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
    // Pin remote image hosts: a wildcard `**` lets any HTTPS host be proxied
    // through `next/image`, which is a footgun (SSRF-flavoured + ghost
    // credit-card abuse vector for paid Image Optimization plans).
    remotePatterns: [
      { protocol: "https", hostname: "infinitedim.dev" },
      { protocol: "https", hostname: "*.infinitedim.dev" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
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
