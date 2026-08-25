import { NextRequest, NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/api/get-api-url";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

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
