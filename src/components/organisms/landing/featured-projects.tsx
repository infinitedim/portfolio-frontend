import { type JSX } from "react";
import { getFeaturedProjects } from "@/lib/data/data-fetching";
import dynamic from "next/dynamic";

const FeaturedProjectsClient = dynamic(
  () => import("./featured-projects-client").then((mod) => mod.FeaturedProjectsClient),
  { ssr: true }
);

export async function FeaturedProjects(): Promise<JSX.Element> {
  const projects = await getFeaturedProjects();

  return <FeaturedProjectsClient projects={projects} />;
}
