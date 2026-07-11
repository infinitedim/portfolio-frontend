import { notFound } from "next/navigation";
import { RoadmapDetailClient } from "./roadmap-detail-client";
import type { Root } from "@/types/detailed_roadmap";
import { Metadata } from "next";
import { getServerApiUrl } from "@/lib/api/get-api-url";

interface PageProps {
  params: Promise<{ techstack: string }>;
}

// Dynamically generate metadata based on the roadmap title
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
      robots: { index: false, follow: true }, // disallow index for crawler per rule
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

async function RoadmapDetailContent({ params }: PageProps) {
  const { techstack } = await params;

  // Validate the techstack format (to prevent path traversal)
  if (!/^[a-zA-Z0-9_-]+$/.test(techstack)) {
    return notFound();
  }

  // Ensure request-time rendering
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
