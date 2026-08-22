// @vitest-environment jsdom
import { describe, it, expect, jest, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { TurnstileResumeModal } from "../turnstile-resume-modal";

mock.module("@marsidev/react-turnstile", () => ({
  Turnstile: () => <div data-testid="turnstile-widget">Turnstile Widget</div>,
}));

mock.module("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("TurnstileResumeModal", () => {
  it("renders modal when isOpen is true", () => {
    render(<TurnstileResumeModal isOpen={true} onOpenChange={jest.fn()} />);

    expect(screen.getByText("Security Check")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Please complete the Cloudflare security verification below/i,
      ),
    ).toBeInTheDocument();
  });

  it("does not render modal content when isOpen is false", () => {
    render(<TurnstileResumeModal isOpen={false} onOpenChange={jest.fn()} />);

    expect(screen.queryByText("Security Check")).not.toBeInTheDocument();
  });
});
