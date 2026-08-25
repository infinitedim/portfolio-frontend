/**
 * Representation of a social media link and account profile metadata.
 */
export interface SocialLink {
  /** Name of the social media or developer platform (e.g., 'GitHub', 'LinkedIn'). */
  platform: string;
  /** Full URL to the user's profile on the platform. */
  url: string;
  /** Public username handle on the platform. */
  handle?: string;
  /** Icon registry identifier representing the platform logo. */
  icon: string;
}

/**
 * List of primary public social profile links and developer platforms.
 */
export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: "GitHub",
    url: "https://github.com/infinitedim",
    icon: "github",
  },
  {
    platform: "LinkedIn",
    url: "https://linkedin.com/in/infinitedim",
    icon: "linkedin",
  },
  {
    platform: "Twitter",
    url: "https://twitter.com/yourblooo",
    handle: "@yourblooo",
    icon: "twitter",
  },
];

/**
 * Retrieves a social link record matching the specified platform name (case-insensitive).
 *
 * @param platform - Name of the platform to search for (e.g., 'github', 'linkedin', 'twitter').
 * @returns The matching {@link SocialLink} object, or `undefined` if not found.
 *
 * @example
 * ```ts
 * const github = getSocialLink("github");
 * console.log(github?.url);
 * ```
 */
export function getSocialLink(platform: string): SocialLink | undefined {
  return SOCIAL_LINKS.find(
    (link) => link.platform.toLowerCase() === platform.toLowerCase(),
  );
}
