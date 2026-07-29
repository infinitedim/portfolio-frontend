"use client";

import { JSX, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/utils";
import { DEFAULT_SIZES, getBlurDataUrl } from "@/lib/utils/image-utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  preload?: boolean;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  sizes?: string;
}

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
        priority={priority}
        preload={preload || priority}
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

