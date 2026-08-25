import sharp from "sharp";

/**
 * Supported output image format types for image transformation and optimization.
 */
export type SupportedImageFormat = "webp" | "png" | "jpeg" | "avif";

/**
 * Configuration options for resizing and encoding images.
 */
export interface ImageResizeOptions {
  /** Target image width in pixels. */
  width?: number;
  /** Target image height in pixels. */
  height?: number;
  /** Output compression quality (1-100). Defaults to 80. */
  quality?: number;
  /** Output image format encoding. Defaults to 'webp'. */
  format?: SupportedImageFormat;
  /** Image resizing fit strategy when both width and height are provided. */
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

/**
 * Result object produced by the image optimization pipeline, indicating success or failure.
 */
export type ImageOptimizationResult =
  | {
      /** Indicates successful optimization. */
      success: true;
      /** The processed and optimized binary image data buffer. */
      buffer: Uint8Array;
      /** The resulting image format. */
      format: SupportedImageFormat;
      /** Identifies the underlying processing engine utilized. */
      engineUsed: "bun-image" | "sharp";
      /** Width of the optimized image in pixels if resized. */
      width?: number;
      /** Height of the optimized image in pixels if resized. */
      height?: number;
    }
  | {
      /** Indicates optimization failure. */
      success: false;
      /** Error message describing the reason for failure. */
      error: string;
      /** The processing engine attempted when the failure occurred. */
      engineUsed?: "bun-image" | "sharp";
    };

/**
 * Type interface for Bun runtime's native Image processing instance.
 */
interface BunImageInstance {
  /**
   * Resizes the current Bun image instance.
   * @param options - Dimensions to resize image to.
   * @param options.width - Target image width in pixels.
   * @param options.height - Target image height in pixels.
   * @returns Resized Bun image instance.
   */
  resize(options: { width?: number; height?: number }): BunImageInstance;
  /**
   * Converts the Bun image instance into a binary buffer.
   * @param format - Target encoding format name.
   * @param options - Encoding options.
   * @param options.quality - Output compression quality.
   * @returns Promise resolving to image buffer.
   */
  toBuffer(format?: string, options?: { quality?: number }): Promise<Uint8Array>;
}

/**
 * Type interface for Bun's global Image API namespace.
 */
interface BunImageGlobal {
  /**
   * Constructs a Bun Image instance from an input binary buffer.
   * @param input - Input image binary data.
   * @returns Promise resolving to a BunImageInstance.
   */
  from(input: ArrayBuffer | Uint8Array): Promise<BunImageInstance>;
}

/**
 * Optimizes, resizes, and converts an input image buffer to a desired format.
 * Attempts to use Bun's native image engine first if available, falling back to Sharp.
 * @param inputBuffer - Raw binary data of the source image.
 * @param options - Custom resizing, quality, and format options.
 * @returns Promise resolving to the optimization result with output buffer or error details.
 */
export async function optimizeImage(
  inputBuffer: ArrayBuffer | Uint8Array,
  options: ImageResizeOptions = {},
): Promise<ImageOptimizationResult> {
  const quality = options.quality ?? 80;
  const format = options.format ?? "webp";
  const width = options.width;
  const height = options.height;

  const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun as
    | { Image?: BunImageGlobal }
    | undefined;

  if (bunGlobal && typeof bunGlobal.Image?.from === "function") {
    try {
      const img = await bunGlobal.Image.from(inputBuffer);
      if (width || height) {
        img.resize({ width, height });
      }
      const outputBuffer = await img.toBuffer(format, { quality });

      return {
        success: true,
        buffer: outputBuffer,
        format,
        engineUsed: "bun-image",
        width,
        height,
      };
    } catch {
      void 0;
    }
  }

  try {
    const bufferInput =
      inputBuffer instanceof Uint8Array
        ? Buffer.from(inputBuffer.buffer, inputBuffer.byteOffset, inputBuffer.byteLength)
        : Buffer.from(inputBuffer);
    let pipeline = sharp(bufferInput);

    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: options.fit ?? "cover",
      });
    }

    if (format === "webp") {
      pipeline = pipeline.webp({ quality });
    } else if (format === "png") {
      pipeline = pipeline.png({ quality });
    } else if (format === "jpeg") {
      pipeline = pipeline.jpeg({ quality });
    } else if (format === "avif") {
      pipeline = pipeline.avif({ quality });
    }

    const outputBuffer = await pipeline.toBuffer();

    return {
      success: true,
      buffer: new Uint8Array(outputBuffer),
      format,
      engineUsed: "sharp",
      width,
      height,
    };
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to process image with sharp";
    return {
      success: false,
      error: errorMsg,
      engineUsed: "sharp",
    };
  }
}
