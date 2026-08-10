import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectMockupFrame } from "./project-mockup-frame";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill: _fill, priority: _priority, placeholder: _placeholder, blurDataURL: _blurDataURL, ...rest } = props;
    return <img {...rest} alt={(rest.alt as string) ?? ""} />;
  },
}));

describe("ProjectMockupFrame", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
  });

  it("returns null when imageUrl is empty string", () => {
    if (!canRunTests) return;
    const { container } = render(
      <ProjectMockupFrame imageUrl="" projectName="Test" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders macOS window control dots", () => {
    if (!canRunTests) return;
    const { container } = render(
      <ProjectMockupFrame imageUrl="/test.jpg" projectName="Test" />,
    );
    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots).toHaveLength(3);
  });

  it("renders domain text when provided", () => {
    if (!canRunTests) return;
    render(
      <ProjectMockupFrame
        imageUrl="/test.jpg"
        projectName="Test"
        domain="dimscode.com"
      />,
    );
    expect(screen.getByText("dimscode.com")).toBeInTheDocument();
  });

  it("renders image with correct alt text", () => {
    if (!canRunTests) return;
    render(
      <ProjectMockupFrame imageUrl="/test.jpg" projectName="My Project" />,
    );
    expect(
      screen.getByAltText("Screenshot of My Project"),
    ).toBeInTheDocument();
  });

  it("has accessible role and label", () => {
    if (!canRunTests) return;
    render(
      <ProjectMockupFrame imageUrl="/test.jpg" projectName="My Project" />,
    );
    expect(
      screen.getByRole("img", { name: /preview of my project/i }),
    ).toBeInTheDocument();
  });
});
