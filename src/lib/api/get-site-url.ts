/**
 * Default fallback frontend website URL used during local development.
 */
const DEFAULT_SITE_URL = "http://localhost:3000";

/**
 * Resolves the absolute base URL of the frontend application based on environment variables.
 * Checks `NEXT_PUBLIC_BASE_URL`, then `NEXT_PUBLIC_SITE_URL`, falling back to `http://localhost:3000`.
 *
 * @returns {string} The fully qualified site base URL.
 *
 * @example
 * ```ts
 * const siteUrl = getSiteUrl();
 * const canonicalUrl = `${siteUrl}/blog/post-1`;
 * ```
 */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    DEFAULT_SITE_URL
  );
}
