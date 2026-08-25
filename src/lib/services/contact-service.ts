   
                        
  
                                                                           
                                                                     
                                                          
  
                                                                          
                                                                  
   

export interface ContactSubmission {
  name: string;
  email: string;
  subject?: string;
  message: string;
                                                               
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

import { getApiUrl } from "@/lib/api/get-api-url";

function getApiBase(): string {
  return getApiUrl();
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
