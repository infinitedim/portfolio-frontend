import { getServerApiUrl } from "@/lib/api/get-api-url";

/**
 * Represents the backend status response payload checking whether the portfolio gate is unlocked.
 */
interface GateStatusResponse {
  /**
   * Whether the user's session has successfully unlocked the portfolio.
   */
  unlocked: boolean;
}

/**
 * Queries the backend gate status endpoint using server-side cookies to verify if the client has unlocked portfolio access.
 * @param cookieHeader - Serialized cookie header containing gate session tokens.
 * @returns A promise resolving to true if the backend confirms the gate is unlocked, false otherwise.
 */
export async function getGateUnlockedFromBackend(
  cookieHeader: string,
): Promise<boolean> {
  if (!cookieHeader.trim()) return false;

  try {
    const response = await fetch(`${getServerApiUrl()}/api/gate/status`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) return false;
    const data = (await response.json()) as GateStatusResponse;
    return Boolean(data.unlocked);
  } catch {
    return false;
  }
}
