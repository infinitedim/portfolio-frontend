import sharp from "sharp";

export type SupportedImageFormat = "webp" | "png" | "jpeg" | "avif";

export interface ImageResizeOptions {
  width?: number;
  height?: number;
  quality?: number;                       
  format?: SupportedImageFormat;                   
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

export type ImageOptimizationResult =
  | {
      success: true;
      buffer: Uint8Array;
      format: SupportedImageFormat;
      engineUsed: "bun-image" | "sharp";
      width?: number;
      height?: number;
    }
  | {
      success: false;
      error: string;
      engineUsed?: "bun-image" | "sharp";
    };

interface BunImageInstance {
  resize(options: { width?: number; height?: number }): BunImageInstance;
  toBuffer(format?: string, options?: { quality?: number }): Promise<Uint8Array>;
}

interface BunImageGlobal {
  from(input: ArrayBuffer | Uint8Array): Promise<BunImageInstance>;
}

   
                                                                              
                                                                           
   
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
    } // eslint-disable-next-line no-empty
    catch {}
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
