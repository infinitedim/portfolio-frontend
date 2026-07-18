import { MetadataRoute } from "next";
import { getServerApiUrl } from "@/lib/api/get-api-url";
import { getSiteUrl } from "@/lib/api/get-site-url";

function getBackendUrl(): string {
  return getServerApiUrl();
}

interface BlogPostItem {
  slug: string;
  updatedAt?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const currentDate = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/roadmap`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
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

  return [...staticRoutes, ...blogRoutes];
}
