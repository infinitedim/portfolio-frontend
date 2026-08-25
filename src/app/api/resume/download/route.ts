import { NextRequest, NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/api/get-api-url";

/**
 * Response payload structure from Cloudflare Turnstile siteverify API.
 */
interface TurnstileVerifyResponse {
  /**
   * Whether the verification token passed successfully.
   */
  success: boolean;
  /**
   * List of error codes returned if verification failed.
   */
  "error-codes"?: string[];
  /**
   * Timestamp of the challenge ISO string.
   */
  challenge_ts?: string;
  /**
   * Hostname where the challenge was solved.
   */
  hostname?: string;
}

/**
 * Fetches the raw PDF resume from the backend service and streams it to the client.
 *
 * @returns A promise resolving to a Response containing the PDF binary stream or an error JSON.
 */
async function fetchRawPdfResponse(): Promise<Response> {
  const backendUrl = `${getServerApiUrl()}/api/resume/raw`;
  const pdfResponse = await fetch(backendUrl, {
    headers: {
      Accept: "application/pdf",
    },
    cache: "no-store",
  });

  if (!pdfResponse.ok) {
    console.error(
      `Failed to fetch resume PDF from backend: ${pdfResponse.status}`,
    );
    return NextResponse.json(
      { error: "Resume file temporarily unavailable" },
      { status: 503 },
    );
  }

  const pdfBuffer = await pdfResponse.arrayBuffer();

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="Dimas_Saputra_Resume.pdf"',
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

/**
 * Handles GET requests to download the resume, redirecting to challenge if protected in production.
 *
 * @param request - The incoming NextRequest instance.
 * @returns A promise resolving to a Response with the PDF binary or a redirection response.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const secretKey = process.env.CF_TURNSTILE_SECRET_KEY;
  const isDev = process.env.NODE_ENV === "development";

                                                                                                       
  if (secretKey && !isDev) {
    return NextResponse.redirect(
      new URL("/?resume=protected", request.url),
    );
  }

  return fetchRawPdfResponse();
}

/**
 * Handles POST requests to verify Cloudflare Turnstile token and return the resume PDF.
 *
 * @param request - The incoming NextRequest containing the verification token in JSON body.
 * @returns A promise resolving to a Response with the PDF binary or verification error JSON.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body =
      typeof request.json === "function"
        ? await request.json().catch(() => ({}))
        : {};
    const token = body?.token;

    const secretKey = process.env.CF_TURNSTILE_SECRET_KEY;
    const isDev = process.env.NODE_ENV === "development";

                                                                                
    if (secretKey && !isDev) {
      if (!token) {
        return NextResponse.json(
          { error: "Turnstile verification token is required" },
          { status: 400 },
        );
      }

      const clientIp =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "";

      const formData = new URLSearchParams();
      formData.append("secret", secretKey);
      formData.append("response", token);
      if (clientIp) {
        formData.append("remoteip", clientIp);
      }

      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        },
      );

      const verifyData: TurnstileVerifyResponse = await verifyRes.json();

      if (!verifyData.success) {
        console.warn(
          "Turnstile verification failed:",
          verifyData["error-codes"],
        );
        return NextResponse.json(
          { error: "Bot verification failed. Please try again." },
          { status: 403 },
        );
      }
    }

    return fetchRawPdfResponse();
  } catch (error) {
    console.error("Error handling resume download route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
