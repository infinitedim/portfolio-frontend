import { type JSX } from "react";
import { getServerApiUrl } from "@/lib/api/get-api-url";
import dynamic from "next/dynamic";

const LatestPostsClient = dynamic(
  () => import("./latest-posts-client").then((mod) => mod.LatestPostsClient),
  { ssr: true },
);

interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  readingTimeMinutes: number;
  createdAt: string;
}

async function getLatestPosts(): Promise<BlogPostItem[]> {
  try {
    const backendUrl = getServerApiUrl();
    const response = await fetch(
      `${backendUrl}/api/blog?pageSize=3&published=true`,
      { next: { revalidate: 3600 } },
    );
    if (response.ok) {
      const data = await response.json();
      return data.items ?? [];
    }
  } catch (error) {
    console.error("Failed to fetch latest posts:", error);
  }
  return [];
}

export async function LatestPosts(): Promise<JSX.Element> {
  const posts = await getLatestPosts();

  return <LatestPostsClient posts={posts} />;
}
