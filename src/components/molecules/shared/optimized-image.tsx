"use client";

import { JSX, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/utils";
import { DEFAULT_SIZES, getBlurDataUrl } from "@/lib/utils/image-utils";

/**
 * Props for the OptimizedImage component.
 */
interface OptimizedImageProps {
  /**
   * Source URL or path for the image asset.
   */
  src: string;
  /**
   * Accessible alternative text describing the image content.
   */
  alt: string;
  /**
   * Intrinsic or target display width in pixels.
   * @defaultValue 400
   */
  width?: number;
  /**
   * Intrinsic or target display height in pixels.
   * @defaultValue 300
   */
  height?: number;
  /**
   * Whether the image should fill its parent container using absolute positioning.
   * @defaultValue false
   */
  fill?: boolean;
  /**
   * Indicates high priority loading (disables lazy loading and preloads image resource).
   * @defaultValue false
   */
  priority?: boolean;
  /**
   * Whether to preload the image resource ahead of rendering.
   * @defaultValue false
   */
  preload?: boolean;
  /**
   * Optional CSS class string applied to the Next.js `Image` element.
   */
  className?: string;
  /**
   * Optional CSS class string applied to the wrapping container element.
   */
  containerClassName?: string;
  /**
   * Optional CSS aspect ratio definition (e.g., '16/9', '4/3', '1/1').
   */
  aspectRatio?: string;
  /**
   * Responsive sizes descriptor defining image layout widths across breakpoints.
   * @defaultValue DEFAULT_SIZES
   */
  sizes?: string;
}

/**
 * OptimizedImage component wraps Next.js `Image` with progressive blur-up placeholders,
 * error state fallbacks, responsive aspect-ratio wrappers, and smooth transition animations.
 *
 * @param props - Configuration properties for the optimized image.
 * @param props.src - Image source URL or path.
 * @param props.alt - Alternative text description.
 * @param props.width - Display width in pixels.
 * @param props.height - Display height in pixels.
 * @param props.fill - Whether to fill parent container.
 * @param props.priority - Priority loading flag.
 * @param props.preload - Preload loading flag.
 * @param props.className - Classes applied to Image.
 * @param props.containerClassName - Classes applied to container.
 * @param props.aspectRatio - CSS aspect ratio.
 * @param props.sizes - Media query responsive sizes string.
 * @returns A JSX element rendering the image wrapper or error fallback state.
 */
export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  fill = false,
  priority = false,
  preload = false,
  className,
  containerClassName,
  aspectRatio,
  sizes = DEFAULT_SIZES,
}: OptimizedImageProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 dark:bg-gray-800",
          containerClassName || className,
        )}
        style={!fill ? { width, height } : undefined}
      >
        <div className="text-center p-4">
          <span className="text-4xl">🖼️</span>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Image not available
          </p>
        </div>
      </div>
    );
  }

  const isPriority = priority || preload;

  return (
    <div
      className={cn("relative overflow-hidden", containerClassName)}
      style={{
        ...(!fill ? { width, height } : {}),
        ...(aspectRatio ? { aspectRatio } : {}),
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        priority={isPriority}
        loading={isPriority ? "eager" : "lazy"}
        sizes={sizes}
        className={cn(
          "duration-700 ease-in-out",
          isLoading
            ? "scale-110 blur-2xl grayscale"
            : "scale-100 blur-0 grayscale-0",
          fill ? "object-cover" : "",
          className,
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        placeholder="blur"
        blurDataURL={getBlurDataUrl(width, height)}
      />
    </div>
  );
}

