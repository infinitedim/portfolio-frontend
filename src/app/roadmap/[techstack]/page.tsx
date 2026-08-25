import { notFound } from "next/navigation";
import { RoadmapDetailClient } from "./roadmap-detail-client";
import type { Root } from "@/types/detailed_roadmap";
import { Metadata } from "next";
import { getServerApiUrl } from "@/lib/api/get-api-url";

/**
 * Route parameter properties for dynamic technology stack roadmap pages.
 *
 * @interface PageProps
 * @property {Promise<{ techstack: string }>} params - Asynchronous route parameters containing the slug of the technology stack.
 */
interface PageProps {
  params: Promise<{ techstack: string }>;
}

/**
 * Generates dynamic SEO metadata for a specific technology stack roadmap.
 *
 * @description Fetches the roadmap details from the backend service to extract title and description.
 * Applies safety validation against invalid characters in the techstack parameter.
 *
 * @param {PageProps} props - The page props containing asynchronous route parameters.
 * @returns {Promise<Metadata>} The computed metadata object for Next.js page generation.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { techstack } = await params;

  if (!/^[a-zA-Z0-9_-]+$/.test(techstack)) {
    return {};
  }

  try {
    const backendUrl = getServerApiUrl();
    const res = await fetch(`${backendUrl}/api/roadmap/detail/${techstack}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      throw new Error(`Backend returned HTTP ${res.status}`);
    }
    const roadmapData = (await res.json()) as Root;
    const title =
      roadmapData.title?.page ?? roadmapData.title?.card ?? techstack;
    return {
      title: `${title} Roadmap | Portfolio`,
      description: roadmapData.description,
      alternates: { canonical: `/roadmap/${techstack}` },
      robots: { index: false, follow: true },
    };
  } catch {
    return {
      title: `${techstack.toUpperCase()} Roadmap | Portfolio`,
      robots: { index: false, follow: true },
    };
  }
}

import { Suspense } from "react";
import { headers } from "next/headers";

/**
 * Renders the Roadmap Detail Page with a suspense boundary fallback.
 *
 * @description Serves as the entry page component for displaying a specific technology
 * roadmap's visual graph and topic checklist.
 *
 * @param {PageProps} props - The component props containing route parameters.
 * @returns {JSX.Element} The rendered React component wrapped in Suspense.
 */
export default function RoadmapDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-neutral-400 font-mono p-5 text-center animate-pulse">
          Loading roadmap structure…
        </div>
      }
    >
      <RoadmapDetailContent params={params} />
    </Suspense>
  );
}

/**
 * Async server component that fetches and resolves roadmap layout data for a technology stack.
 *
 * @description Validates the route parameter, reads headers for request context, calls the backend
 * to retrieve the node graph and edge structures, and returns either the interactive client component
 * or an error fallback UI if the layout data is unavailable.
 *
 * @param {PageProps} props - The component props containing asynchronous route parameters.
 * @returns {Promise<JSX.Element>} The rendered interactive client roadmap component or fallback UI.
 */
async function RoadmapDetailContent({ params }: PageProps) {
  const { techstack } = await params;

  if (!/^[a-zA-Z0-9_-]+$/.test(techstack)) {
    return notFound();
  }

  await headers();

  let roadmapData: Root;
  try {
    const backendUrl = getServerApiUrl();
    const res = await fetch(`${backendUrl}/api/roadmap/detail/${techstack}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      throw new Error(`Backend returned HTTP ${res.status}`);
    }
    roadmapData = (await res.json()) as Root;
  } catch (err) {
    console.error(
      `[roadmap/[techstack]] failed to fetch backend layout for ${techstack}:`,
      err,
    );
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-neutral-400 font-mono p-5 text-center">
        <div>
          <div className="text-3xl mb-3">️</div>
          <h1 className="text-white text-lg font-bold">Layout Not Found</h1>
          <p className="text-sm mt-1">
            We don't have the visual layout structure for "{techstack}" yet.
          </p>
          <a
            href="/roadmap"
            className="mt-4 inline-block text-xs text-sky-500 hover:underline"
          >
            ← Back to Roadmap Progress
          </a>
        </div>
      </div>
    );
  }

  return (
    <RoadmapDetailClient
      techstack={techstack}
      initialStructure={roadmapData}
    />
  );
}
