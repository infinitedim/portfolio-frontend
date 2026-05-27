import { getApiUrl } from "@/lib/api/get-api-url";
import { authService } from "@/lib/auth/auth-service";

export interface SubscribeResponse {
  success: boolean;
  message: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  confirmed: boolean;
  subscribedAt: string;
  confirmedAt: string | null;
}

export interface SubscriberListResponse {
  items: NewsletterSubscriber[];
  total: number;
}

export interface BroadcastResponse {
  sent: number;
  failed: number;
}

function apiBase(): string {
  return getApiUrl();
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
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

export async function subscribeNewsletter(email: string): Promise<SubscribeResponse> {
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

export async function confirmNewsletter(token: string): Promise<SubscribeResponse> {
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

export async function unsubscribeNewsletter(token: string): Promise<SubscribeResponse> {
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

export async function listNewsletterSubscribers(): Promise<SubscriberListResponse> {
  const response = await authedFetch("/api/admin/newsletter/subscribers");
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to load subscribers");
  }
  return response.json();
}

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
