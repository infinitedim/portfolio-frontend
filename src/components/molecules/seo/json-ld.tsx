"use client";

import { type JSX } from "react";

interface JsonLdProps {
  data: Record<string, unknown>;
  type?: "application/ld+json" | "application/json";
}

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
  };

  return <JsonLd data={data} />;
}
