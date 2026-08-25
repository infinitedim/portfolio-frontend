"use client";

import { useEffect, type JSX } from "react";

/**
 * Props for configuring client-side document head metadata in {@link SEOHead}.
 */
interface SEOHeadProps {
  /** The document title displayed in browser tabs and search results. */
  title?: string;
  /** Primary description meta tag used by search engines. */
  description?: string;
  /** List of keywords for indexing and search relevance. */
  keywords?: string[];
  /** Open Graph and Twitter preview image URL or path. Defaults to "/og-image.png". */
  image?: string;
  /** Relative path or absolute URL of the current page. */
  url?: string;
  /** Open Graph page type ('website', 'article', 'profile'). Defaults to 'website'. */
  type?: "website" | "article" | "profile";
  /** Optional Schema.org JSON-LD structured metadata object. */
  structuredData?: Record<string, unknown>;
  /** Whether to tell web crawlers not to index this page. Defaults to false. */
  noindex?: boolean;
  /** Explicit canonical URL link override. */
  canonical?: string;
}

/**
 * Client-side document head manager for dynamic metadata and SEO synchronization.
 *
 * @description Synchronizes document title, standard meta tags (`description`, `keywords`, `robots`),
 * Open Graph properties, Twitter cards, canonical link elements, and JSON-LD structured data directly
 * into `document.head` via DOM manipulation effects.
 *
 * @param props - Metadata settings conforming to {@link SEOHeadProps}.
 * @param props.title - The document title displayed in browser tabs and search results.
 * @param props.description - Primary description meta tag used by search engines.
 * @param props.keywords - List of keywords for indexing and search relevance.
 * @param props.image - Open Graph and Twitter preview image URL or path.
 * @param props.url - Relative path or absolute URL of the current page.
 * @param props.type - Open Graph page type ('website', 'article', 'profile').
 * @param props.structuredData - Optional Schema.org JSON-LD structured metadata object.
 * @param props.noindex - Whether to tell web crawlers not to index this page.
 * @param props.canonical - Explicit canonical URL link override.
 * @returns `null` since all mutations occur as DOM side-effects.
 */
export function SEOHead({
  title,
  description,
  keywords = [],
  image = "/og-image.png",
  url,
  type = "website",
  structuredData,
  noindex = false,
  canonical,
}: SEOHeadProps): null {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://infinitedim.dev";
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
    const fullImageUrl = image.startsWith("http")
      ? image
      : `${baseUrl}${image}`;

    if (title) {
      document.title = title;
    }

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    if (description) {
      metaDescription.setAttribute("content", description);
    }

    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement("meta");
      metaKeywords.setAttribute("name", "keywords");
      document.head.appendChild(metaKeywords);
    }
    if (keywords.length > 0) {
      metaKeywords.setAttribute("content", keywords.join(", "));
    }

    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute(
      "content",
      noindex ? "noindex, nofollow" : "index, follow",
    );

    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", canonical || fullUrl);

    const ogTags = [
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: fullUrl },
      { property: "og:image", content: fullImageUrl },
      { property: "og:site_name", content: "Terminal Portfolio" },
    ];

    ogTags.forEach(({ property, content }) => {
      if (!content) return;

      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.setAttribute("property", property);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute("content", content);
    });

    const twitterTags = [
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: fullImageUrl },
      { name: "twitter:site", content: "@yourblooo" },
      { name: "twitter:creator", content: "@yourblooo" },
    ];

    twitterTags.forEach(({ name, content }) => {
      if (!content) return;

      let metaTag = document.querySelector(`meta[name="${name}"]`);
      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.setAttribute("name", name);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute("content", content);
    });

    if (structuredData) {
      let scriptTag = document.querySelector(
        'script[type="application/ld+json"]',
      );
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.setAttribute("type", "application/ld+json");
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(structuredData);
    }

    return () => {
      const dynamicTags = document.querySelectorAll(
        'meta[data-dynamic="true"]',
      );
      dynamicTags.forEach((tag) => tag.remove());
    };
  }, [
    title,
    description,
    keywords,
    image,
    url,
    type,
    structuredData,
    noindex,
    canonical,
  ]);

  return null;
}

/**
 * Injects project-specific SEO headers, Open Graph tags, and SoftwareApplication structured data.
 *
 * @param props - Project SEO metadata payload.
 * @param props.projectName - Name of the project.
 * @param props.description - Summary description of the project.
 * @param props.technologies - Optional tech stack keywords associated with the project.
 * @param props.image - Optional preview thumbnail URL.
 * @param props.url - Optional canonical URL path for the project.
 * @returns An {@link SEOHead} component managing project head tags.
 */
export function ProjectSEO({
  projectName,
  description,
  technologies = [],
  image,
  url,
}: {
  projectName: string;
  description: string;
  technologies?: string[];
  image?: string;
  url?: string;
}): JSX.Element | null {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: projectName,
    description: description,
    applicationCategory: "WebApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Your Name",
    },
    creator: {
      "@type": "Person",
      name: "Dimas Saputra",
    },
    keywords: technologies.join(", "),
    url:
      url ||
      `https://infinitedim.dev/projects/${projectName.toLowerCase().replace(/\s+/g, "-")}`,
    image: image || "/og-image.png",
  };

  return (
    <SEOHead
      title={`${projectName} | Terminal Portfolio`}
      description={description}
      keywords={["web development", "project", ...technologies]}
      image={image}
      url={url}
      type="article"
      structuredData={structuredData}
    />
  );
}

/**
 * Injects skill-specific SEO headers, Open Graph tags, and TechArticle structured data.
 *
 * @param props - Skill SEO metadata payload.
 * @param props.skillName - Name of the technical skill.
 * @param props.description - Summary description of proficiency and domain.
 * @param props.relatedSkills - Optional list of associated frameworks or tools.
 * @returns An {@link SEOHead} component managing skill head tags.
 */
export function SkillSEO({
  skillName,
  description,
  relatedSkills = [],
}: {
  skillName: string;
  description: string;
  relatedSkills?: string[];
}): JSX.Element | null {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${skillName} Development Skills`,
    description: description,
    author: {
      "@type": "Person",
      name: "Dimas Saputra",
    },
    keywords: [skillName, "development", "programming", ...relatedSkills].join(
      ", ",
    ),
    url: `https://infinitedim.dev/skills/${skillName.toLowerCase()}`,
    publisher: {
      "@type": "Organization",
      name: "Terminal Portfolio",
    },
  };

  return (
    <SEOHead
      title={`${skillName} Development | Terminal Portfolio`}
      description={description}
      keywords={[skillName, "development", "programming", ...relatedSkills]}
      type="article"
      structuredData={structuredData}
    />
  );
}

