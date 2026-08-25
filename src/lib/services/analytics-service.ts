export interface PageviewPayload {
  path: string;
  slug?: string;
}

export async function recordPageview(payload: PageviewPayload): Promise<void> {
  try {
    await fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } // eslint-disable-next-line no-empty
    catch {}
}
