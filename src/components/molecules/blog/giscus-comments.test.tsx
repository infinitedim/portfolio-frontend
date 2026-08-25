import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

                     
mock.module("@giscus/react", () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="giscus-mock" data-theme={props.theme} data-repo={props.repo} data-category={props.category}>
      Giscus Mock
    </div>
  ),
}));

                   
mock.module("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark" }),
}));

import { render, screen } from "@testing-library/react";
import { GiscusComments, CommentsSkeleton } from "./giscus-comments";

describe("CommentsSkeleton Component", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
  });

  it("renders loading skeleton with accessible aria-label", () => {
    if (!canRunTests) return;
    render(<CommentsSkeleton />);
    expect(screen.getByLabelText("Loading comments...")).toBeInTheDocument();
  });
});

describe("GiscusComments Component", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns null when required environment variables are missing", () => {
    if (!canRunTests) return;
    delete process.env.NEXT_PUBLIC_GISCUS_REPO;
    delete process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
    delete process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
    delete process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

    const { container } = render(<GiscusComments slug="test-post" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Giscus mock with default transparent_dark theme when env vars are set", () => {
    if (!canRunTests) return;
    process.env.NEXT_PUBLIC_GISCUS_REPO = "infinitedim/portfolio";
    process.env.NEXT_PUBLIC_GISCUS_REPO_ID = "R_123456";
    process.env.NEXT_PUBLIC_GISCUS_CATEGORY = "Blog Comments";
    process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID = "DIC_123456";

    render(<GiscusComments slug="test-post" />);
    const giscusElem = screen.getByTestId("giscus-mock");
    expect(giscusElem).toBeInTheDocument();
    expect(giscusElem).toHaveAttribute("data-theme", "transparent_dark");
    expect(giscusElem).toHaveAttribute("data-repo", "infinitedim/portfolio");
  });

  it("respects custom theme prop override", () => {
    if (!canRunTests) return;
    process.env.NEXT_PUBLIC_GISCUS_REPO = "infinitedim/portfolio";
    process.env.NEXT_PUBLIC_GISCUS_REPO_ID = "R_123456";
    process.env.NEXT_PUBLIC_GISCUS_CATEGORY = "Blog Comments";
    process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID = "DIC_123456";

    render(<GiscusComments slug="test-post" theme="noborder_dark" />);
    const giscusElem = screen.getByTestId("giscus-mock");
    expect(giscusElem).toHaveAttribute("data-theme", "noborder_dark");
  });

  it("prioritizes NEXT_PUBLIC_GISCUS_THEME env variable if set", () => {
    if (!canRunTests) return;
    process.env.NEXT_PUBLIC_GISCUS_REPO = "infinitedim/portfolio";
    process.env.NEXT_PUBLIC_GISCUS_REPO_ID = "R_123456";
    process.env.NEXT_PUBLIC_GISCUS_CATEGORY = "Blog Comments";
    process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID = "DIC_123456";
    process.env.NEXT_PUBLIC_GISCUS_THEME = "dark_dimmed";

    render(<GiscusComments slug="test-post" />);
    const giscusElem = screen.getByTestId("giscus-mock");
    expect(giscusElem).toHaveAttribute("data-theme", "dark_dimmed");
  });
});
