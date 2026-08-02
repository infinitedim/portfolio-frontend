import { MetadataRoute } from "next";
import { getServerApiUrl } from "@/lib/api/get-api-url";
import { getSiteUrl } from "@/lib/api/get-site-url";
import { getProjectsData } from "@/lib/data/data-fetching";

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
        alternates: {
          languages: {
            en: `${baseUrl}/blog/${post.slug}`,
            id: `${baseUrl}/blog/${post.slug}?locale=id`,
            "zh-CN": `${baseUrl}/blog/${post.slug}?locale=zh_CN`,
            "ja-JP": `${baseUrl}/blog/${post.slug}?locale=ja_JP`,
            "ko-KR": `${baseUrl}/blog/${post.slug}?locale=ko_KR`,
            "es-ES": `${baseUrl}/blog/${post.slug}?locale=es_ES`,
            "fr-FR": `${baseUrl}/blog/${post.slug}?locale=fr_FR`,
            "de-DE": `${baseUrl}/blog/${post.slug}?locale=de_DE`,
            "pt-BR": `${baseUrl}/blog/${post.slug}?locale=pt_BR`,
            "ru-RU": `${baseUrl}/blog/${post.slug}?locale=ru_RU`,
            "x-default": `${baseUrl}/blog/${post.slug}`,
          },
        },
      }));
    }
  } catch (error) {
    console.error("Failed to fetch blog posts for sitemap:", error);
  }

  let projectRoutes: MetadataRoute.Sitemap = [];
  try {
    const projects = await getProjectsData();
    projectRoutes = (projects || []).map((project) => ({
      url: `${baseUrl}/projects/${project.slug}`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          en: `${baseUrl}/projects/${project.slug}`,
          id: `${baseUrl}/projects/${project.slug}?locale=id`,
          "zh-CN": `${baseUrl}/projects/${project.slug}?locale=zh_CN`,
          "ja-JP": `${baseUrl}/projects/${project.slug}?locale=ja_JP`,
          "ko-KR": `${baseUrl}/projects/${project.slug}?locale=ko_KR`,
          "es-ES": `${baseUrl}/projects/${project.slug}?locale=es_ES`,
          "fr-FR": `${baseUrl}/projects/${project.slug}?locale=fr_FR`,
          "de-DE": `${baseUrl}/projects/${project.slug}?locale=de_DE`,
          "pt-BR": `${baseUrl}/projects/${project.slug}?locale=pt_BR`,
          "ru-RU": `${baseUrl}/projects/${project.slug}?locale=ru_RU`,
          "x-default": `${baseUrl}/projects/${project.slug}`,
        },
      },
    }));
  } catch (error) {
    console.error("Failed to fetch projects for sitemap:", error);
  }

  return [...staticRoutes, ...blogRoutes, ...projectRoutes];
}

