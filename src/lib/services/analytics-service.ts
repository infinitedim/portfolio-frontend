import { getApiUrl } from "@/lib/api/get-api-url";

export interface PageviewPayload {
  path: string;
  slug?: string;
}

export async function recordPageview(payload: PageviewPayload): Promise<void> {
  try {
    await fetch(`${getApiUrl()}/api/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Beacon — fire and forget
  }
}
