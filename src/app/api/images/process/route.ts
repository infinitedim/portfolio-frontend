import { NextResponse } from "next/server";
import { optimizeImage, type SupportedImageFormat } from "@/lib/images/bun-image-optimizer";

/**
 * Handles HTTP POST requests to optimize, resize, convert, and compress images.
 * Supports both `multipart/form-data` uploads containing an image file with optional
 * dimension, quality, and format fields, as well as raw image binary data in the request body
 * configured via URL query parameters.
 *
 * @param request - The incoming HTTP Request containing the raw image buffer or FormData payload.
 * @returns A promise resolving to a Response with the optimized image buffer and appropriate headers,
 * or a NextResponse error payload with corresponding HTTP status codes (200: success, 400: invalid params, 422: processing failure, 500: internal error).
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let buffer: ArrayBuffer;
    let width: number | undefined;
    let height: number | undefined;
    let quality: number | undefined;
    let format: SupportedImageFormat | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      if (!file) {
        return NextResponse.json({ error: "Missing 'image' file in formData" }, { status: 400 });
      }
      buffer = await file.arrayBuffer();

      const w = formData.get("width");
      const h = formData.get("height");
      const q = formData.get("quality");
      const fmt = formData.get("format");

      if (w) width = parseInt(String(w), 10);
      if (h) height = parseInt(String(h), 10);
      if (q) quality = parseInt(String(q), 10);
      if (fmt) format = String(fmt) as SupportedImageFormat;
    } else {
      buffer = await request.arrayBuffer();
      const url = new URL(request.url);
      const w = url.searchParams.get("width");
      const h = url.searchParams.get("height");
      const q = url.searchParams.get("quality");
      const fmt = url.searchParams.get("format");

      if (w) width = parseInt(w, 10);
      if (h) height = parseInt(h, 10);
      if (q) quality = parseInt(q, 10);
      if (fmt) format = fmt as SupportedImageFormat;
    }

    if (!buffer || buffer.byteLength === 0) {
      return NextResponse.json({ error: "Empty image payload" }, { status: 400 });
    }

    const result = await optimizeImage(buffer, {
      width,
      height,
      quality,
      format,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    const mimeTypeMap: Record<SupportedImageFormat, string> = {
      webp: "image/webp",
      png: "image/png",
      jpeg: "image/jpeg",
      avif: "image/avif",
    };

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", mimeTypeMap[result.format] || "image/webp");
    responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
    responseHeaders.set("X-Image-Engine", result.engineUsed);

    return new Response(Buffer.from(result.buffer), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Image optimization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
