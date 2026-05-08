/**
 * Contact-form service.
 *
 * Talks to the backend `/api/contact` endpoint. The backend persists every
 * message and *optionally* fires an operator notification email if a
 * mailer is configured — that is invisible to the client.
 *
 * The honeypot field (`website`) is sent untouched: real users won't fill
 * it but bots typically do, and the backend silently drops those.
 */

export interface ContactSubmission {
  name: string;
  email: string;
  subject?: string;
  message: string;
  /** Honeypot — must always be empty for human submissions. */
  website?: string;
}

export interface ContactSuccess {
  ok: true;
  id: string;
}

export interface ContactFailure {
  ok: false;
  status: number;
  error: string;
}

export type ContactResult = ContactSuccess | ContactFailure;

function getApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.BACKEND_URL ??
    "http://localhost:3001"
  );
}

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
    } catch {
      // ignore JSON parse failure — fall back to status text
    }
    return {
      ok: false,
      status: response.status,
      error: detail || response.statusText || "Failed to submit message",
    };
  }

  const data = (await response.json()) as { id: string };
  return { ok: true, id: data.id };
}
