import { authService } from "@/lib/auth/auth-service";
import { getApiUrl } from "@/lib/api/get-api-url";

/**
 * Represents a contact form message retrieved via the administrative API.
 *
 * @interface AdminContactMessage
 */
export interface AdminContactMessage {
  /** Unique identifier of the message. */
  id: string;
  /** Name of the sender. */
  name: string;
  /** Email address of the sender. */
  email: string;
  /** Message subject line, if provided. */
  subject: string | null;
  /** Body text of the submitted contact message. */
  message: string;
  /** Client IP address of the submitter. */
  ipAddress: string | null;
  /** Browser/client User-Agent string. */
  userAgent: string | null;
  /** Read status indicating if an administrator has reviewed the message. */
  read: boolean;
  /** ISO date string representing when the message was sent. */
  createdAt: string;
}

/**
 * Paginated list response for admin contact message queries.
 *
 * @interface AdminMessagesListResponse
 */
export interface AdminMessagesListResponse {
  /** Array of message records on the current page. */
  items: AdminContactMessage[];
  /** 1-based page index. */
  page: number;
  /** Number of message entries requested per page. */
  pageSize: number;
  /** Total number of messages available. */
  total: number;
  /** Total unread messages count. */
  unread: number;
}

/**
 * Query options for filtering and paginating admin contact messages.
 *
 * @interface ListMessagesOptions
 */
export interface ListMessagesOptions {
  /** Optional page number to fetch. */
  page?: number;
  /** Optional page size limit. */
  pageSize?: number;
  /** When true, restricts results to unread messages only. */
  unreadOnly?: boolean;
}

/**
 * Resolves the base URL for the backend API.
 *
 * @returns {string} The base API endpoint URL.
 */
function getApiBase(): string {
  return getApiUrl();
}

/**
 * Retrieves the active access token for authenticated requests, attempting a refresh if needed.
 *
 * @async
 * @returns {Promise<string | null>} The access token string if authenticated, or null otherwise.
 */
async function getAuthToken(): Promise<string | null> {
  const existing = authService.getAccessToken();
  if (existing) return existing;
  const refreshed = await authService.refresh();
  if (refreshed.success) {
    return authService.getAccessToken();
  }
  return null;
}

/**
 * Performs an authenticated HTTP fetch request by appending the Bearer access token to request headers.
 *
 * @async
 * @param {string} path - The relative endpoint path (e.g. `/api/admin/messages`).
 * @param {RequestInit} [init] - Standard RequestInit options to configure the fetch call.
 * @returns {Promise<Response>} The fetch Response promise.
 * @throws {Error} Throws if user is not authenticated.
 */
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

/**
 * Fetches a paginated list of contact messages submitted by users.
 *
 * @async
 * @param options - Optional query parameters for pagination and unread filter.
 * @returns Paginated message records and count metadata.
 * @throws {Error} Throws if the network response is not successful.
 */
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

/**
 * Updates the read status of an individual contact message.
 *
 * @async
 * @param {string} id - The ID of the message to update.
 * @param {boolean} read - True to mark as read, false to mark as unread.
 * @returns {Promise<AdminContactMessage>} The updated contact message record.
 * @throws {Error} Throws if the update request fails.
 */
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

/**
 * Permanently deletes a single contact message by its identifier.
 *
 * @async
 * @param {string} id - The ID of the message to delete.
 * @returns {Promise<void>} Resolves when the deletion completes successfully.
 * @throws {Error} Throws if the deletion request fails.
 */
export async function deleteMessage(id: string): Promise<void> {
  const res = await authedFetch(`/api/admin/messages/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete message: ${res.status}`);
  }
}

/**
 * Marks multiple contact messages as read in a single batch operation.
 *
 * @async
 * @param {string[]} ids - Array of message IDs to mark as read.
 * @returns {Promise<{ affected: number }>} Object containing count of updated messages.
 * @throws {Error} Throws if the bulk update fails.
 */
export async function bulkMarkMessagesRead(
  ids: string[],
): Promise<{ affected: number }> {
  const res = await authedFetch("/api/admin/messages/bulk", {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    throw new Error(`Failed to bulk mark read: ${res.status}`);
  }
  return res.json() as Promise<{ affected: number }>;
}

/**
 * Deletes multiple contact messages in a single batch operation.
 *
 * @async
 * @param {string[]} ids - Array of message IDs to remove.
 * @returns {Promise<{ affected: number }>} Object containing count of deleted messages.
 * @throws {Error} Throws if the bulk delete fails.
 */
export async function bulkDeleteMessages(
  ids: string[],
): Promise<{ affected: number }> {
  const res = await authedFetch("/api/admin/messages/bulk", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    throw new Error(`Failed to bulk delete: ${res.status}`);
  }
  return res.json() as Promise<{ affected: number }>;
}
