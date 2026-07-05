import { type JSX } from "react";
import { getAboutData } from "@/lib/data/data-fetching";
import { AboutSectionClient } from "./about-section-client";

export async function AboutSection(): Promise<JSX.Element | null> {
  const about = await getAboutData();

  if (!about?.bio) {
    return null;
  }

  return <AboutSectionClient about={about} />;
}
