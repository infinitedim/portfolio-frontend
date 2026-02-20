import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://infinitedim.site";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/projects",
          "/skills",
          "/about",
          "/contact",
          "/blog",
          "/sitemap.xml",
          "/robots.txt",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
          "/temp/",
          "/draft/",
          "/test/",
          "/dev/",
          "/staging/",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/projects", "/skills", "/about", "/contact", "/blog"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/projects", "/images/", "/og-image.png", "/avatar.jpg"],
        disallow: ["/api/", "/admin/", "/private/", "/_next/", "/sw.js"],
        crawlDelay: 1,
      },
      {
        userAgent: "Googlebot-Mobile",
        allow: ["/", "/projects", "/skills", "/about", "/contact", "/blog"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "Bingbot",
        allow: ["/", "/projects", "/skills", "/about", "/contact", "/blog"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "Slurp",
        allow: ["/", "/projects", "/skills", "/about", "/contact", "/blog"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "DuckDuckBot",
        allow: ["/", "/projects", "/skills", "/about", "/contact", "/blog"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        allow: ["/", "/projects", "/skills", "/about", "/contact", "/blog"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 10,
      },
      {
        userAgent: "AhrefsBot",
        allow: ["/", "/projects", "/skills", "/about", "/contact", "/blog"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 10,
      },
      {
        userAgent: "SemrushBot",
        allow: ["/", "/projects", "/skills", "/about", "/contact", "/blog"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 10,
      },
      {
        userAgent: "MJ12bot",
        allow: ["/", "/projects", "/skills", "/about", "/contact", "/blog"],
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/_next/",
          "/sw.js",
          "*.json$",
        ],
        crawlDelay: 10,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
