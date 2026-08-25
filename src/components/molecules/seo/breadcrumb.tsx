"use client";

import Link from "next/link";
import { type JSX } from "react";
import { UrlObject } from "url";

/**
 * Represents a single crumb within the breadcrumb navigation hierarchy.
 */
interface BreadcrumbItem {
  /** The human-readable label displayed for the crumb. */
  label: string;
  /** The target URL or route object the crumb navigates to. */
  href: UrlObject | string;
  /** Whether this crumb denotes the current active page (disabling link behavior). */
  current?: boolean;
}

/**
 * Props for the {@link Breadcrumb} navigation component.
 */
interface BreadcrumbProps {
  /** Ordered list of breadcrumb items from root to current destination. */
  items: BreadcrumbItem[];
  /** Optional custom CSS classes for styling the nav element. */
  className?: string;
}

/**
 * Renders breadcrumb navigation alongside structured Schema.org JSON-LD metadata.
 *
 * @description Creates an accessible `<nav aria-label="Breadcrumb">` list with chevron separators,
 * current-page ARIA tagging, and dynamically injects `schema.org/BreadcrumbList` script tags.
 *
 * @param props - Component properties conforming to {@link BreadcrumbProps}.
 * @param props.items - Ordered list of breadcrumb items from root to current destination.
 * @param props.className - Optional custom CSS classes for styling the nav element.
 * @returns A JSX element rendering JSON-LD structured data and breadcrumb navigation links.
 */
export function Breadcrumb({
  items,
  className = "",
}: BreadcrumbProps): JSX.Element {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${baseUrl}${item.href}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <nav
        aria-label="Breadcrumb"
        className={`flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 ${className}`}
      >
        <ol className="flex items-center space-x-2">
          {items.map((item, index) => (
            <li
              key={`${item.href}`}
              className="flex items-center"
            >
              {index > 0 && (
                <svg
                  className="w-4 h-4 mx-2 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}

              {item.current ? (
                <span
                  className="font-medium text-gray-900 dark:text-gray-100"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href as any}
                  className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/**
 * Pre-configured breadcrumb item generators for common application routes.
 */
export const BreadcrumbTemplates = {
  /**
   * Generates breadcrumbs for the home page.
   *
   * @returns Array with home crumb marked as current.
   */
  home: () => [{ label: "Home", href: "/", current: true }],

  /**
   * Generates breadcrumbs for the projects index page.
   *
   * @returns Array with home and projects crumbs.
   */
  projects: () => [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects", current: true },
  ],

  /**
   * Generates breadcrumbs for a specific project detail page.
   *
   * @param projectName - Display name of the project.
   * @param projectSlug - URL slug for the project.
   * @returns Array of crumbs leading to the project page.
   */
  project: (projectName: string, projectSlug: string) => [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: projectName, href: `/projects/${projectSlug}`, current: true },
  ],

  /**
   * Generates breadcrumbs for the skills index page.
   *
   * @returns Array with home and skills crumbs.
   */
  skills: () => [
    { label: "Home", href: "/" },
    { label: "Skills", href: "/skills", current: true },
  ],

  /**
   * Generates breadcrumbs for an individual skill detail page.
   *
   * @param skillName - Display name of the skill.
   * @param skillSlug - URL slug for the skill.
   * @returns Array of crumbs leading to the skill page.
   */
  skill: (skillName: string, skillSlug: string) => [
    { label: "Home", href: "/" },
    { label: "Skills", href: "/skills" },
    { label: skillName, href: `/skills/${skillSlug}`, current: true },
  ],

  /**
   * Generates breadcrumbs for the about page.
   *
   * @returns Array with home and about crumbs.
   */
  about: () => [
    { label: "Home", href: "/" },
    { label: "About", href: "/about", current: true },
  ],

  /**
   * Generates breadcrumbs for the contact page.
   *
   * @returns Array with home and contact crumbs.
   */
  contact: () => [
    { label: "Home", href: "/" },
    { label: "Contact", href: "/contact", current: true },
  ],

  /**
   * Generates breadcrumbs for the blog index page.
   *
   * @returns Array with home and blog crumbs.
   */
  blog: () => [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog", current: true },
  ],

  /**
   * Generates breadcrumbs for an individual blog post page.
   *
   * @param postTitle - Title of the blog post.
   * @param postSlug - URL slug for the blog post.
   * @returns Array of crumbs leading to the blog post.
   */
  blogPost: (postTitle: string, postSlug: string) => [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: postTitle, href: `/blog/${postSlug}`, current: true },
  ],

  /**
   * Generates breadcrumbs for the services index page.
   *
   * @returns Array with home and services crumbs.
   */
  services: () => [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services", current: true },
  ],

  /**
   * Generates breadcrumbs for an individual service detail page.
   *
   * @param serviceName - Name of the service.
   * @param serviceSlug - URL slug for the service.
   * @returns Array of crumbs leading to the service page.
   */
  service: (serviceName: string, serviceSlug: string) => [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: serviceName, href: `/services/${serviceSlug}`, current: true },
  ],
};

