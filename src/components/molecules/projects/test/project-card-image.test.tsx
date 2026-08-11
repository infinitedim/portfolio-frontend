import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectCardImage } from "../project-card-image";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("ProjectCardImage Component", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
  });

  it("renders image component with priority when featured is true", () => {
    if (!canRunTests) return;
    render(
      <ProjectCardImage
        src="/avatar.jpg"
        alt="Test Screenshot"
        featured={true}
      />
    );

    const img = screen.getByAltText("Test Screenshot");
    expect(img).toBeInTheDocument();
  });

  it("renders image component without priority when featured is false", () => {
    if (!canRunTests) return;
    render(
      <ProjectCardImage
        src="/avatar.jpg"
        alt="Test Screenshot"
        featured={false}
      />
    );

    const img = screen.getByAltText("Test Screenshot");
    expect(img).toBeInTheDocument();
  });
});
