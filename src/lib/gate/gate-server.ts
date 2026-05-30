import { getServerApiUrl } from "@/lib/api/get-api-url";

interface GateStatusResponse {
  unlocked: boolean;
}

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
