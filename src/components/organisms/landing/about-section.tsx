import { type JSX } from "react";
import { getAboutData } from "@/lib/data/data-fetching";
import dynamic from "next/dynamic";

const AboutSectionClient = dynamic(
  () => import("./about-section-client").then((mod) => mod.AboutSectionClient),
  { ssr: true },
);

export async function AboutSection(): Promise<JSX.Element | null> {
  const about = await getAboutData();

  if (!about?.bio) {
    return null;
  }

  return <AboutSectionClient about={about} />;
}
