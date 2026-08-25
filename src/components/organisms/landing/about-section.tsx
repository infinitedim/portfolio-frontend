import { type JSX } from "react";
import { getAboutData } from "@/lib/data/data-fetching";
import { AboutSectionClient } from "./about-section-client";

/**
 * Server component that fetches and renders the About section on the landing page.
 *
 * @description
 * Reads the active locale cookie (`portfolio_locale`) dynamically on the server,
 * requests about data corresponding to that locale, and renders {@link AboutSectionClient}.
 * If no bio data is available, returns `null` to avoid rendering an empty container.
 *
 * @returns A promise resolving to the rendered About section JSX element or `null` if bio data is missing.
 */
export async function AboutSection(): Promise<JSX.Element | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const locale = cookieStore.get("portfolio_locale")?.value ?? "en_US";

  const about = await getAboutData(locale);

  if (!about?.bio) {
    return null;
  }

  return <AboutSectionClient about={about} />;
}
