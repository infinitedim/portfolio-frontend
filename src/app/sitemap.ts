import { MetadataRoute } from "next";
import { getServerApiUrl } from "@/lib/api/get-api-url";
import { getSiteUrl } from "@/lib/api/get-site-url";
import { getProjectsData } from "@/lib/data/data-fetching";

/**
 * Resolves the server-side API base URL from environment variables.
 *
 * @returns {string} The normalized base URL for the backend API.
 */
function getBackendUrl(): string {
  return getServerApiUrl();
}

/**
 * Represents a blog post item payload for sitemap URL and language alternate generation.
 *
 * @interface BlogPostItem
 * @property {string} slug - Unique URL slug of the blog article.
 * @property {string} [locale] - Language code or locale tag for the article translation (e.g., 'en', 'id').
 * @property {string} [translationStatus] - Status of translation for internationalized post.
 * @property {string} [updatedAt] - ISO timestamp string of the last modification.
 */
interface BlogPostItem {
  slug: string;
  locale?: string;
  translationStatus?: string;
  updatedAt?: string;
}

/**
 * Generates the complete dynamic sitemap for the portfolio website.
 *
 * @description Aggregates static primary application routes, published multi-locale blog posts
 * with hreflang alternates, and dynamic project showcase pages into a standard sitemap structure.
 *
 * @async
 * @returns {Promise<MetadataRoute.Sitemap>} The array of sitemap route entries for Next.js metadata generation.
 */
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
      const rawItems: BlogPostItem[] = data.items || [];

                                                           
      const postsBySlug = new Map<string, BlogPostItem[]>();
      for (const item of rawItems) {
        const existing = postsBySlug.get(item.slug) || [];
        existing.push(item);
        postsBySlug.set(item.slug, existing);
      }

      blogRoutes = Array.from(postsBySlug.entries()).map(([slug, translations]) => {
        const primaryPost =
          translations.find((t) => t.locale === "en" || t.locale === "en_US") ||
          translations[0];

        const languages: Record<string, string> = {
          "x-default": `${baseUrl}/blog/${slug}`,
          en: `${baseUrl}/blog/${slug}`,
        };

        for (const t of translations) {
          if (!t.locale || t.locale === "en" || t.locale === "en_US") continue;
          const isoCode = t.locale.replace("_", "-");
          languages[isoCode] = `${baseUrl}/blog/${slug}?locale=${t.locale}`;
        }

        return {
          url: `${baseUrl}/blog/${slug}`,
          lastModified: primaryPost?.updatedAt ? new Date(primaryPost.updatedAt) : currentDate,
          changeFrequency: "monthly" as const,
          priority: 0.6,
          alternates: {
            languages,
          },
        };
      });
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
          "x-default": `${baseUrl}/projects/${project.slug}`,
        },
      },
    }));
  } catch (error) {
    console.error("Failed to fetch projects for sitemap:", error);
  }

  return [...staticRoutes, ...blogRoutes, ...projectRoutes];
}

