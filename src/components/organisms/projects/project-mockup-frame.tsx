import Image from "next/image";
import { type JSX } from "react";
import { getBlurDataUrl } from "@/lib/utils/image-utils";

/**
 * Properties for the {@link ProjectMockupFrame} component.
 */
interface ProjectMockupFrameProps {
  /**
   * URL of the screenshot or preview image to render inside the mockup.
   */
  readonly imageUrl: string;
  /**
   * Name of the project, used for accessible labels and image alt text.
   */
  readonly projectName: string;
  /**
   * Optional custom domain or URL shown in the browser mockup address bar.
   */
  readonly domain?: string;
  /**
   * Optional CSS class names for styling the outer mockup container.
   */
  readonly className?: string;
}

/**
 * Renders a browser-styled window mockup containing an optimized project screenshot with blur placeholder.
 *
 * @param {ProjectMockupFrameProps} props - Component properties.
 * @param {string} props.imageUrl - URL of the preview image.
 * @param {string} props.projectName - Name of the project for accessibility labels.
 * @param {string} [props.domain] - Optional domain displayed in the header title bar.
 * @param {string} [props.className] - Optional custom CSS classes.
 * @returns {JSX.Element | null} The rendered browser mockup frame or `null` if no image URL is provided.
 */
export function ProjectMockupFrame({
  imageUrl,
  projectName,
  domain,
  className = "",
}: ProjectMockupFrameProps): JSX.Element | null {
  if (!imageUrl) {
    return null;
  }

  const blurDataUrl = getBlurDataUrl(560, 315);

  return (
    <div
      role="img"
      aria-label={`Preview of ${projectName}`}
      className={`rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden transition-shadow duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.06)] ${className}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800 bg-neutral-900/80">
        <div className="w-3 h-3 rounded-full bg-[#FF5F56]" aria-hidden="true" />
        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" aria-hidden="true" />
        <div className="w-3 h-3 rounded-full bg-[#27C93F]" aria-hidden="true" />
        {domain && (
          <span className="font-mono text-xs text-neutral-500 ml-2 truncate">
            {domain}
          </span>
        )}
      </div>
      <div className="relative aspect-video overflow-hidden group">
        <Image
          src={imageUrl}
          alt={`Screenshot of ${projectName}`}
          fill
          className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 560px"
          placeholder="blur"
          blurDataURL={blurDataUrl}
        />
      </div>
    </div>
  );
}
