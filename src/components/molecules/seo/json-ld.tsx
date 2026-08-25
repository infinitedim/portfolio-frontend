"use client";

import { type JSX } from "react";

/**
 * Props for the generic {@link JsonLd} structured data script component.
 */
interface JsonLdProps {
  /** The structured JSON-LD data payload to serialize. */
  data: Record<string, unknown>;
  /** MIME type attribute for the script element. Defaults to "application/ld+json". */
  type?: "application/ld+json" | "application/json";
}

/**
 * Injects a script tag containing formatted JSON-LD structured metadata into the DOM.
 *
 * @param props - Component properties conforming to {@link JsonLdProps}.
 * @param props.data - The structured JSON-LD data payload to serialize.
 * @param props.type - MIME type attribute for the script element.
 * @returns A `<script>` JSX element with safely formatted JSON payload.
 */
export function JsonLd({
  data,
  type = "application/ld+json",
}: JsonLdProps): JSX.Element {
  return (
    <script
      type={type}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2),
      }}
    />
  );
}

/**
 * Renders a Schema.org `Person` JSON-LD structured metadata block.
 *
 * Injects identity information for individual developers or authors,
 * including social profiles, skills, job title, and organization affiliations.
 *
 * @param props - Person metadata configuration object.
 * @param props.name - Full display name of the person.
 * @param props.url - Canonical profile or website URL.
 * @param props.image - Optional avatar or profile picture URL.
 * @param props.jobTitle - Optional occupation or job title.
 * @param props.description - Optional bio or description text.
 * @param props.sameAs - Optional external social profile URLs.
 * @param props.knowsAbout - Optional list of technical topics or areas of expertise.
 * @param props.worksFor - Optional company or organization name.
 * @returns A JSON-LD script element formatted for Schema.org Person.
 */
export function PersonSchema({
  name,
  url,
  image,
  jobTitle,
  description,
  sameAs,
  knowsAbout,
  worksFor,
}: {
  name: string;
  url: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  sameAs?: string[];
  knowsAbout?: string[];
  worksFor?: string;
}): JSX.Element {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url,
    ...(image && { image }),
    ...(jobTitle && { jobTitle }),
    ...(description && { description }),
    ...(sameAs && { sameAs }),
    ...(knowsAbout && { knowsAbout }),
    ...(worksFor && {
      worksFor: {
        "@type": "Organization",
        name: worksFor,
      },
    }),
  };

  return <JsonLd data={data} />;
}

/**
 * Renders a Schema.org `WebSite` JSON-LD structured metadata block.
 *
 * Represents the top-level website entity, author info, and optional sitelink search box actions.
 *
 * @param props - Website metadata configuration object.
 * @param props.name - Site title or application name.
 * @param props.url - Canonical site root URL.
 * @param props.description - Optional site description.
 * @param props.author - Optional primary author or creator name.
 * @param props.potentialAction - Optional Sitelinks Searchbox action definition.
 * @param props.potentialAction.target - Target search URL template.
 * @param props.potentialAction.queryInput - Name of the query parameter for search input.
 * @returns A JSON-LD script element formatted for Schema.org WebSite.
 */
export function WebSiteSchema({
  name,
  url,
  description,
  author,
  potentialAction,
}: {
  name: string;
  url: string;
  description?: string;
  author?: string;
  potentialAction?: {
    target: string;
    queryInput: string;
  };
}): JSX.Element {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    ...(description && { description }),
    ...(author && {
      author: {
        "@type": "Person",
        name: author,
      },
    }),
    ...(potentialAction && {
      potentialAction: {
        "@type": "SearchAction",
        target: potentialAction.target,
        "query-input": potentialAction.queryInput,
      },
    }),
  };

  return <JsonLd data={data} />;
}

/**
 * Renders a Schema.org `SoftwareApplication` JSON-LD structured metadata block.
 *
 * Provides rich metadata for applications and software projects,
 * including pricing offers, author/creator information, category, and operating system.
 *
 * @param props - Software application configuration object.
 * @param props.name - Name of the application or software project.
 * @param props.description - Summary description of features and purpose.
 * @param props.applicationCategory - Optional category classification (e.g., "WebApplication").
 * @param props.operatingSystem - Optional supported platforms or browsers.
 * @param props.offers - Optional price and currency details.
 * @param props.offers.price - Price amount.
 * @param props.offers.priceCurrency - Currency code (e.g., USD, IDR).
 * @param props.author - Optional application author name.
 * @param props.creator - Optional creator entity name.
 * @param props.keywords - Optional comma-separated technology tags.
 * @param props.url - Optional link to the application or repository.
 * @param props.image - Optional banner or icon image URL.
 * @returns A JSON-LD script element formatted for Schema.org SoftwareApplication.
 */
export function SoftwareApplicationSchema({
  name,
  description,
  applicationCategory,
  operatingSystem,
  offers,
  author,
  creator,
  keywords,
  url,
  image,
}: {
  name: string;
  description: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
  author?: string;
  creator?: string;
  keywords?: string;
  url?: string;
  image?: string;
}): JSX.Element {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    ...(applicationCategory && { applicationCategory }),
    ...(operatingSystem && { operatingSystem }),
    ...(offers && {
      offers: {
        "@type": "Offer",
        price: offers.price,
        priceCurrency: offers.priceCurrency,
      },
    }),
    ...(author && {
      author: {
        "@type": "Person",
        name: author,
      },
    }),
    ...(creator && {
      creator: {
        "@type": "Person",
        name: creator,
      },
    }),
    ...(keywords && { keywords }),
    ...(url && { url }),
    ...(image && { image }),
  };

  return <JsonLd data={data} />;
}

/**
 * Renders a Schema.org `Organization` JSON-LD structured metadata block.
 *
 * Injects structured organization profiles with postal addresses and contact points.
 *
 * @param props - Organization metadata configuration object.
 * @param props.name - Organization or company name.
 * @param props.url - Organization website URL.
 * @param props.logo - Optional URL to the organization logo image.
 * @param props.description - Optional company bio or mission statement.
 * @param props.address - Optional postal address details.
 * @param props.address.streetAddress - Street address.
 * @param props.address.addressLocality - City or locality.
 * @param props.address.addressRegion - State or region.
 * @param props.address.postalCode - Postal code.
 * @param props.address.addressCountry - Country code or name.
 * @param props.contactPoint - Optional customer or technical support contact points.
 * @param props.contactPoint.telephone - Contact telephone number.
 * @param props.contactPoint.contactType - Contact point type (e.g., customer service).
 * @param props.contactPoint.email - Optional contact email address.
 * @returns A JSON-LD script element formatted for Schema.org Organization.
 */
export function OrganizationSchema({
  name,
  url,
  logo,
  description,
  address,
  contactPoint,
}: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint?: {
    telephone: string;
    contactType: string;
    email?: string;
  };
}): JSX.Element {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    ...(logo && { logo }),
    ...(description && { description }),
    ...(address && {
      address: {
        "@type": "PostalAddress",
        ...address,
      },
    }),
    ...(contactPoint && {
      contactPoint: {
        "@type": "ContactPoint",
        ...contactPoint,
      },
    }),
  };

  return <JsonLd data={data} />;
}

/**
 * Renders a Schema.org `BreadcrumbList` JSON-LD structured metadata block.
 *
 * Describes a sequence of navigational breadcrumbs with positional indices.
 *
 * @param props - Breadcrumb list items payload.
 * @param props.items - Array of breadcrumb entries with names and target URLs.
 * @returns A JSON-LD script element formatted for Schema.org BreadcrumbList.
 */
export function BreadcrumbListSchema({
  items,
}: {
  items: Array<{
    name: string;
    item: string;
  }>;
}): JSX.Element {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };

  return <JsonLd data={data} />;
}

/**
 * Renders a Schema.org `FAQPage` JSON-LD structured metadata block.
 *
 * Formats a list of questions and verified answers for Google rich search results.
 *
 * @param props - FAQ questions configuration.
 * @param props.questions - Array of question-and-answer pairs.
 * @returns A JSON-LD script element formatted for Schema.org FAQPage.
 */
export function FAQPageSchema({
  questions,
}: {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}): JSX.Element {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return <JsonLd data={data} />;
}

/**
 * Renders a Schema.org `Article` JSON-LD structured metadata block.
 *
 * Structured metadata for articles, blog posts, and technical writeups with author and publisher references.
 *
 * @param props - Article metadata configuration.
 * @param props.headline - Main article title or headline.
 * @param props.description - Concise summary or excerpt.
 * @param props.author - Author name string.
 * @param props.publisher - Publishing organization name.
 * @param props.datePublished - ISO 8601 published date string.
 * @param props.dateModified - Optional ISO 8601 modified date string.
 * @param props.image - Optional article header/featured image URL.
 * @param props.url - Optional canonical URL to the article.
 * @param props.keywords - Optional keywords or tags.
 * @param props.inLanguage - Optional BCP 47 language tag (e.g., "en-US").
 * @returns A JSON-LD script element formatted for Schema.org Article.
 */
export function ArticleSchema({
  headline,
  description,
  author,
  publisher,
  datePublished,
  dateModified,
  image,
  url,
  keywords,
  inLanguage,
}: {
  headline: string;
  description: string;
  author: string;
  publisher: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url?: string;
  keywords?: string;
  inLanguage?: string;
}): JSX.Element {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: publisher,
    },
    datePublished,
    ...(dateModified && { dateModified }),
    ...(image && { image }),
    ...(url && { url }),
    ...(keywords && { keywords }),
    ...(inLanguage && { inLanguage }),
  };

  return <JsonLd data={data} />;
}

