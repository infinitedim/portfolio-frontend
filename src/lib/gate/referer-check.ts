/**
 * Default fallback site URL used during local development if environment variables are not specified.
 */
const DEFAULT_SITE_URL = "http://localhost:3000";

/**
 * Resolves the fully qualified base URL for the portfolio site from environment variables (SITE_URL, NEXT_PUBLIC_BASE_URL, VERCEL_URL) or default fallback.
 * @returns Fully qualified base site URL string.
 */
export function getSiteUrl(): string {
  return (
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : DEFAULT_SITE_URL)
  );
}

/**
 * Computes the expected URL for the `/terminal` gate route based on the resolved site URL.
 * @returns Expected terminal referer URL string.
 */
export function getTerminalRefererUrl(): string {
  return `${getSiteUrl().replace(/\/$/, "")}/terminal`;
}

/**
 * Validates whether an incoming HTTP `Referer` header string originates from the valid `/terminal` gate page.
 * @param referer - The HTTP `Referer` header value to evaluate, or null if omitted.
 * @returns True if the referer exactly matches or starts with the expected terminal URL, false otherwise.
 */
export function isValidTerminalReferer(referer: string | null): boolean {
  if (!referer) return false;

  const expected = getTerminalRefererUrl();
  const trimmed = referer.trim();
  return (
    trimmed === expected ||
    trimmed.startsWith(`${expected}/`) ||
    trimmed.startsWith(`${expected}?`)
  );
}
