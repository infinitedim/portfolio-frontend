import { getApiUrl } from "@/lib/api/get-api-url";

/**
 * Data payload for submitting a contact message.
 *
 * @interface ContactSubmission
 */
export interface ContactSubmission {
  /** Full name of the person sending the message. */
  name: string;
  /** Sender email address. */
  email: string;
  /** Optional topic/subject line. */
  subject?: string;
  /** Message body contents. */
  message: string;
  /** Honeypot anti-spam field; must remain empty. */
  website?: string;
}

/**
 * Successful response indicating a contact message was received and stored.
 *
 * @interface ContactSuccess
 */
export interface ContactSuccess {
  /** Discriminant flag indicating success. */
  ok: true;
  /** Unique ID of the stored message. */
  id: string;
}

/**
 * Failure response indicating an error occurred during contact message submission.
 *
 * @interface ContactFailure
 */
export interface ContactFailure {
  /** Discriminant flag indicating failure. */
  ok: false;
  /** HTTP response status code, or 0 on network abort/failure. */
  status: number;
  /** Error explanation message. */
  error: string;
}

/**
 * Discriminated union result representing outcome of contact message submission.
 */
export type ContactResult = ContactSuccess | ContactFailure;


/**
 * Resolves the base URL for the backend API.
 *
 * @returns {string} Base API URL string.
 */
function getApiBase(): string {
  return getApiUrl();
}

/**
 * Submits a contact form message to the backend API endpoint.
 *
 * @async
 * @function submitContactMessage
 * @param {ContactSubmission} payload - Contact form fields submitted by the user.
 * @returns {Promise<ContactResult>} Result object indicating success with message ID or failure with error details.
 */
export async function submitContactMessage(
  payload: ContactSubmission,
): Promise<ContactResult> {
  const apiBase = getApiBase();
  const url = `${apiBase}/api/contact`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error:
        err instanceof Error
          ? `Network error: ${err.message}`
          : "Network error",
    };
  }

  if (!response.ok) {
    let detail = "";
    try {
      const data = (await response.json()) as { error?: string };
      detail = data.error ?? "";
    } // eslint-disable-next-line no-empty
    catch {}
    return {
      ok: false,
      status: response.status,
      error: detail || response.statusText || "Failed to submit message",
    };
  }

  const data = (await response.json()) as { id: string };
  return { ok: true, id: data.id };
}
