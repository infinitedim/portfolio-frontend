"use client";

import { JSX, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/utils";
import { Folder } from "lucide-react";
import { DEFAULT_SIZES, getBlurDataUrl } from "@/lib/utils/image-utils";

interface ProjectCardImageProps {
  src: string;
  alt: string;
  featured?: boolean;
  className?: string;
}

export function ProjectCardImage({
  src,
  alt,
  featured = false,
  className,
}: ProjectCardImageProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-terminal-muted/10",
          className,
        )}
      >
        <div className="text-center flex flex-col items-center">
          <div className="mb-2 text-terminal-muted">
            <Folder
              size={36}
              className="stroke-[1.5]"
            />
          </div>
          <div className="text-sm text-terminal-muted">Project Preview</div>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={featured}
      sizes={DEFAULT_SIZES}
      className={cn(
        "object-cover duration-700 ease-in-out",
        isLoading
          ? "scale-110 blur-2xl grayscale"
          : "scale-100 blur-0 grayscale-0",
        className,
      )}
      onLoad={() => setIsLoading(false)}
      onError={() => setHasError(true)}
      placeholder="blur"
      blurDataURL={getBlurDataUrl(400, 192)}
    />
  );
}

