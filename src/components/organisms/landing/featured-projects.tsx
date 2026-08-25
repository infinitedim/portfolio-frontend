import { type JSX } from "react";
import { getFeaturedProjects } from "@/lib/data/data-fetching";
import { FeaturedProjectsClient } from "./featured-projects-client";

/**
 * Server component that fetches and renders featured projects on the landing page.
 *
 * @description
 * Fetches the curated list of featured projects via {@link getFeaturedProjects} on the server
 * and passes the result down to {@link FeaturedProjectsClient} for interactive client rendering.
 *
 * @returns A promise resolving to the rendered featured projects JSX element.
 */
export async function FeaturedProjects(): Promise<JSX.Element> {
  const projects = await getFeaturedProjects();

  return <FeaturedProjectsClient projects={projects} />;
}
