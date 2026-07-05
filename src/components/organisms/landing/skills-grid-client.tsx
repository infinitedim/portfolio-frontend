"use client";

import { type JSX } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { SkillCategory } from "@/lib/data/data-fetching";
import { FadeIn, StaggerContainer, HoverCard } from "@/components/atoms/shared/motion-wrappers";

interface SkillsGridClientProps {
  categories: SkillCategory[];
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: "text-blue-400",
  intermediate: "text-yellow-400",
  advanced: "text-orange-400",
  expert: "text-green-400",
};

export function SkillsGridClient({ categories }: SkillsGridClientProps): JSX.Element {
  const { t } = useI18n();

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "beginner":
        return t("levelBeginner");
      case "intermediate":
        return t("levelIntermediate");
      case "advanced":
        return t("levelAdvanced");
      case "expert":
        return t("levelExpert");
      default:
        return level;
    }
  };

  return (
    <section className="border-t border-neutral-800 px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <FadeIn direction="up" duration={0.5}>
          <h2 className="mb-8 font-mono text-2xl font-bold text-green-400">
            {t("landingSkillsTitle")}
          </h2>
        </FadeIn>
        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.slice(0, 6).map((category, index) => (
            <FadeIn key={category.name} direction="up" delay={index * 0.08} duration={0.5}>
              <HoverCard scale={1.02} className="h-full">
                <div className="h-full rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                  <h3 className="mb-3 font-mono text-sm font-semibold text-white">
                    {category.name}
                  </h3>
                  <ul className="space-y-1.5">
                    {category.skills.slice(0, 5).map((skill) => (
                      <li
                        key={skill.name}
                        className="flex items-center justify-between font-mono text-xs"
                      >
                        <span className="text-neutral-300">{skill.name}</span>
                        <span
                          className={
                            LEVEL_COLORS[skill.level] ?? "text-neutral-500"
                          }
                        >
                          {getLevelLabel(skill.level)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </HoverCard>
            </FadeIn>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
