import { describe, expect, it } from "vitest";
import { SOCIAL_LINKS, getSocialLink } from "../social-links";

describe("social-links", () => {
  it("exports canonical social links", () => {
    expect(SOCIAL_LINKS.length).toBeGreaterThanOrEqual(3);
    expect(SOCIAL_LINKS.some((l) => l.handle === "@yourblooo")).toBe(true);
  });

  it("finds links by platform name", () => {
    expect(getSocialLink("GitHub")?.url).toContain("github.com");
  });
});
