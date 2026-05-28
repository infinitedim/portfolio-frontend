const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : DEFAULT_SITE_URL)
  );
}

export function getTerminalRefererUrl(): string {
  return `${getSiteUrl().replace(/\/$/, "")}/terminal`;
}

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
