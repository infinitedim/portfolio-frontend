import { type JSX } from "react";
import { getSkillsData } from "@/lib/data/data-fetching";
import { SkillsGridClient } from "./skills-grid-client";

export async function SkillsGrid(): Promise<JSX.Element | null> {
  const categories = await getSkillsData();

  if (!categories.length) {
    return null;
  }

  return <SkillsGridClient categories={categories} />;
}
