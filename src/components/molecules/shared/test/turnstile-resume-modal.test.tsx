import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TurnstileResumeModal } from "../turnstile-resume-modal";

vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: () => <div data-testid="turnstile-widget">Turnstile Widget</div>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("TurnstileResumeModal", () => {
  it("renders modal when isOpen is true", () => {
    render(<TurnstileResumeModal isOpen={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("Security Check")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Please complete the Cloudflare security verification below/i,
      ),
    ).toBeInTheDocument();
  });

  it("does not render modal content when isOpen is false", () => {
    render(<TurnstileResumeModal isOpen={false} onOpenChange={vi.fn()} />);

    expect(screen.queryByText("Security Check")).not.toBeInTheDocument();
  });
});
