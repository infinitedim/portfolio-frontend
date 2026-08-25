import { getApiUrl } from "@/lib/api/get-api-url";
import { authService } from "@/lib/auth/auth-service";

/**
 * Response payload returned after initiating newsletter subscription, confirmation, or unsubscription.
 */
export interface SubscribeResponse {
  /** Indicates whether the subscription operation completed successfully. */
  success: boolean;
  /** Human-readable status or confirmation message. */
  message: string;
}

/**
 * Represents a newsletter subscriber record with confirmation status and timestamps.
 */
export interface NewsletterSubscriber {
  /** Unique subscriber identifier. */
  id: string;
  /** Subscriber's email address. */
  email: string;
  /** Whether the subscriber has confirmed their email address via double opt-in. */
  confirmed: boolean;
  /** ISO date string when subscription was requested. */
  subscribedAt: string;
  /** ISO date string when subscription was confirmed, or null if unconfirmed. */
  confirmedAt: string | null;
}

/**
 * Paginated subscriber list response retrieved via administrative endpoints.
 */
export interface SubscriberListResponse {
  /** Array of subscriber records. */
  items: NewsletterSubscriber[];
  /** Total count of registered subscribers. */
  total: number;
}

/**
 * Delivery summary statistics returned after sending an administrative newsletter broadcast.
 */
export interface BroadcastResponse {
  /** Number of emails successfully dispatched. */
  sent: number;
  /** Number of failed email dispatches. */
  failed: number;
}

/**
 * Resolves the base URL for the backend API.
 *
 * @returns The base API endpoint URL.
 */
function apiBase(): string {
  return getApiUrl();
}

/**
 * Executes an authenticated fetch request appending Bearer access token headers.
 *
 * @param path - Relative API route path.
 * @param init - Optional RequestInit configuration options.
 * @returns Promise resolving to the fetch Response.
 * @throws {Error} If authentication token is missing or refresh fails.
 */
async function authedFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let token = authService.getAccessToken();
  if (!token) {
    const refreshed = await authService.refresh();
    if (refreshed.success) {
      token = authService.getAccessToken();
    }
  }
  if (!token) {
    throw new Error("Authentication required");
  }
  return fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    credentials: "include",
  });
}

/**
 * Subscribes an email address to the newsletter, initiating double opt-in confirmation.
 *
 * @param email - Target email address to subscribe.
 * @returns Promise resolving to the subscription response object.
 * @throws {Error} If subscription request fails.
 */
export async function subscribeNewsletter(
  email: string,
): Promise<SubscribeResponse> {
  const response = await fetch(`${apiBase()}/api/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Subscription failed");
  }
  return data;
}

/**
 * Confirms a newsletter subscription using the verification token sent via email.
 *
 * @param token - Confirmation token from the email verification link.
 * @returns Promise resolving to confirmation status.
 * @throws {Error} If token is invalid or confirmation fails.
 */
export async function confirmNewsletter(
  token: string,
): Promise<SubscribeResponse> {
  const response = await fetch(
    `${apiBase()}/api/newsletter/confirm?token=${encodeURIComponent(token)}`,
    { headers: { Accept: "application/json" } },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Confirmation failed");
  }
  return data;
}

/**
 * Unsubscribes a user from the newsletter using their unique unsubscribe token.
 *
 * @param token - Unsubscribe token associated with the subscriber.
 * @returns Promise resolving to unsubscribe status.
 * @throws {Error} If unsubscription request fails.
 */
export async function unsubscribeNewsletter(
  token: string,
): Promise<SubscribeResponse> {
  const response = await fetch(`${apiBase()}/api/newsletter/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Unsubscribe failed");
  }
  return data;
}

/**
 * Retrieves the full list of newsletter subscribers for administration.
 *
 * @returns Promise resolving to the subscriber list response.
 * @throws {Error} If request is unauthorized or retrieval fails.
 */
export async function listNewsletterSubscribers(): Promise<SubscriberListResponse> {
  const response = await authedFetch("/api/admin/newsletter/subscribers");
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to load subscribers");
  }
  return response.json();
}

/**
 * Dispatches a newsletter broadcast email campaign to all confirmed subscribers.
 *
 * @param payload - Object containing email subject and body content.
 * @param payload.subject - The email subject line.
 * @param payload.body - The HTML or Markdown body content of the newsletter broadcast.
 * @returns Promise resolving to broadcast delivery counts.
 * @throws {Error} If request is unauthorized or broadcast dispatch fails.
 */
export async function broadcastNewsletter(payload: {
  subject: string;
  body: string;
}): Promise<BroadcastResponse> {
  const response = await authedFetch("/api/admin/newsletter/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? "Broadcast failed");
  }
  return response.json();
}
