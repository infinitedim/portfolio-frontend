export interface SocialLink {
  platform: string;
  url: string;
  handle?: string;
  icon: string;
}

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

export function getSocialLink(platform: string): SocialLink | undefined {
  return SOCIAL_LINKS.find(
    (link) => link.platform.toLowerCase() === platform.toLowerCase(),
  );
}
