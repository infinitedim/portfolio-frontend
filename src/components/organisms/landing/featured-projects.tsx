import { type JSX } from "react";
import { getFeaturedProjects } from "@/lib/data/data-fetching";
import { FeaturedProjectsClient } from "./featured-projects-client";

export async function FeaturedProjects(): Promise<JSX.Element> {
  const projects = await getFeaturedProjects();

  return <FeaturedProjectsClient projects={projects} />;
}
