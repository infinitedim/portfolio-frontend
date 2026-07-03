"use client";

import { JSX, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/utils";
import { Folder } from "lucide-react";

interface ProjectCardImageProps {
  src: string;
  alt: string;
  featured?: boolean;
  className?: string;
}

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

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
            <Folder size={36} className="stroke-[1.5]" />
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
      preload={featured}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
      blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(400, 192))}`}
    />
  );
}
