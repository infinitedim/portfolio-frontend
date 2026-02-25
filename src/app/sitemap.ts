import { MetadataRoute } from "next";

function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001"
  );
}

interface BlogPostItem {
  slug: string;
  updatedAt?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://infinitedim.site";
  const currentDate = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/skills`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/resume`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const dynamicProjectRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/projects/terminal-portfolio`,
      lastModified: new Date("2024-01-15"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/projects/ecommerce-platform`,
      lastModified: new Date("2024-01-10"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects/task-management`,
      lastModified: new Date("2024-01-08"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects/weather-dashboard`,
      lastModified: new Date("2024-01-05"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/projects/chat-application`,
      lastModified: new Date("2024-01-03"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/projects/portfolio-website`,
      lastModified: new Date("2024-01-01"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const technologyRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/skills/react`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/skills/nextjs`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/skills/typescript`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/skills/nodejs`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/skills/javascript`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/skills/python`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/services/web-development`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/frontend-development`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/backend-development`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/full-stack-development`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services/react-development`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/nextjs-development`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(
      `${backendUrl}/api/blog?pageSize=500&published=true`,
      { next: { revalidate: 3600 } },
    );

    if (response.ok) {
      const data = await response.json();
      blogRoutes = (data.items || []).map((post: BlogPostItem) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt ? new Date(post.updatedAt) : currentDate,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch blog posts for sitemap:", error);
  }

  const legalRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/sitemap.xml`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  return [
    ...staticRoutes,
    ...dynamicProjectRoutes,
    ...technologyRoutes,
    ...serviceRoutes,
    ...blogRoutes,
    ...legalRoutes,
  ];
}
