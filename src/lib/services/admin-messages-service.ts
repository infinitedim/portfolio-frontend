/**
 * Admin contact-messages service.
 *
 * All endpoints under `/api/admin/messages` require an admin bearer token,
 * minted by `authService` after successful login. We attach the token from
 * memory; if it's missing we attempt a silent refresh first because the
 * refresh path reads the HttpOnly cookie and may still be valid even when
 * the in-memory access token is empty (page reload, etc).
 */

import { authService } from "@/lib/auth/auth-service";

export interface AdminContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  ipAddress: string | null;
  userAgent: string | null;
  read: boolean;
  createdAt: string;
}

export interface AdminMessagesListResponse {
  items: AdminContactMessage[];
  page: number;
  pageSize: number;
  total: number;
  unread: number;
}

export interface ListMessagesOptions {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

function getApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.BACKEND_URL ??
    "http://localhost:3001"
  );
}

async function getAuthToken(): Promise<string | null> {
  const existing = authService.getAccessToken();
  if (existing) return existing;
  // Cookie-based refresh: if the HttpOnly refresh cookie is still alive we
  // can mint a new access token without any user interaction.
  const refreshed = await authService.refresh();
  if (refreshed.success) {
    return authService.getAccessToken();
  }
  return null;
}

async function authedFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  return fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
}

export async function listMessages(
  options: ListMessagesOptions = {},
): Promise<AdminMessagesListResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set("page", String(options.page));
  if (options.pageSize) params.set("pageSize", String(options.pageSize));
  if (options.unreadOnly) params.set("unreadOnly", "true");
  const qs = params.toString();
  const url = `/api/admin/messages${qs ? `?${qs}` : ""}`;
  const res = await authedFetch(url);
  if (!res.ok) {
    throw new Error(`Failed to list messages: ${res.status}`);
  }
  return res.json() as Promise<AdminMessagesListResponse>;
}

export async function markMessageRead(
  id: string,
  read: boolean,
): Promise<AdminContactMessage> {
  const res = await authedFetch(`/api/admin/messages/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ read }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update message: ${res.status}`);
  }
  return res.json() as Promise<AdminContactMessage>;
}

export async function deleteMessage(id: string): Promise<void> {
  const res = await authedFetch(`/api/admin/messages/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete message: ${res.status}`);
  }
}
