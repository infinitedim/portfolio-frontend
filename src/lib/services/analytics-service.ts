/**
 * Payload data structure for reporting a page view analytics event.
 *
 * @interface PageviewPayload
 * @property {string} path - The relative URL pathname being viewed (e.g., `/blog/my-post`).
 * @property {string} [slug] - Optional identifier or slug for specific content entities (such as a blog post or project).
 */
export interface PageviewPayload {
  /**
   * The relative URL path of the page being viewed.
   */
  path: string;

  /**
   * Optional resource slug or identifier associated with the page view.
   */
  slug?: string;
}

/**
 * Sends a non-blocking pageview beacon to the analytics endpoint.
 * Silently catches any delivery failures to avoid disrupting user experience.
 *
 * @async
 * @function recordPageview
 * @param {PageviewPayload} payload - The pageview event details including path and optional slug.
 * @returns {Promise<void>} Resolves when the request is dispatched or caught.
 */
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
