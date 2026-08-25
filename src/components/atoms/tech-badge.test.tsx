import { describe, it, expect, jest, beforeEach } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { TechBadge } from "./tech-badge";
import { getTechConfig, normalizeTechKey } from "./tech-icon-registry";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("TechIconRegistry", () => {
  it("normalizes tech keys accurately", () => {
    expect(normalizeTechKey("React")).toBe("react");
    expect(normalizeTechKey("Next.js")).toBe("nextjs");
    expect(normalizeTechKey("Tailwind CSS")).toBe("tailwindcss");
    expect(normalizeTechKey("PostgreSQL")).toBe("postgresql");
    expect(normalizeTechKey("TypeScript")).toBe("typescript");
    expect(normalizeTechKey("Docker")).toBe("docker");
    expect(normalizeTechKey("Tokio")).toBe("tokio");
    expect(normalizeTechKey("Loki")).toBe("loki");
    expect(normalizeTechKey("Kubernetes")).toBe("kubernetes");
    expect(normalizeTechKey("K8s")).toBe("kubernetes");
  });

  it("retrieves known technology config", () => {
    const config = getTechConfig("React");
    expect(config.label).toBe("React");
    expect(config.color.toLowerCase()).toBe("#61dafb");
    expect(config.category).toBe("framework");
  });

  it("retrieves fallback monogram config for unknown tech", () => {
    const config = getTechConfig("MyUnknownFramework");
    expect(config.label).toBe("MyUnknownFramework");
    expect(config.color).toBe("#10b981");
  });
});

describe("TechBadge Component", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
  });

  it("renders known technology badge with correct label and aria-hidden icon", () => {
    if (!canRunTests) return;
    render(<TechBadge name="React" />);

    expect(screen.getByText("React")).toBeInTheDocument();
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("renders fallback monogram badge for unknown tech without crashing", () => {
    if (!canRunTests) return;
    render(<TechBadge name="CustomLib" />);

    expect(screen.getByText("CustomLib")).toBeInTheDocument();
    expect(screen.getByText("CU")).toBeInTheDocument();                     
  });

  it("renders removable button when removable prop is true", () => {
    if (!canRunTests) return;
    const handleRemove = jest.fn();
    render(<TechBadge name="Docker" removable onRemove={handleRemove} />);

    const removeBtn = screen.getByRole("button", { name: "Remove Docker" });
    expect(removeBtn).toBeInTheDocument();

    fireEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it("renders different size variants", () => {
    if (!canRunTests) return;
    const { container: smContainer } = render(<TechBadge name="Rust" size="sm" />);
    const { container: lgContainer } = render(<TechBadge name="Rust" size="lg" />);

    expect(smContainer.firstChild).toHaveClass("text-xs");
    expect(lgContainer.firstChild).toHaveClass("text-sm");
  });
});
