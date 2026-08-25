"use client";

import { i18n } from "@/lib/i18n";
import { Component } from "react";

/**
 * Properties for configuring the ImageErrorBoundary component.
 */
interface Props {
  /** Child elements wrapped by the boundary (usually an Image component) */
  children: React.ReactNode;
  /** Optional custom fallback UI to render when image fails to load */
  fallback?: React.ReactNode;
}

/**
 * State structure for ImageErrorBoundary.
 */
interface State {
  /** Whether an error occurred while loading or rendering the image */
  hasError: boolean;
}

/**
 * Specialized error boundary component designed to catch and gracefully handle
 * failures when rendering remote or optimized images.
 */
export class ImageErrorBoundary extends Component<Props, State> {
  /**
   * Initializes the ImageErrorBoundary instance with initial clean state.
   *
   * @param props - Component properties.
   */
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Updates state to render fallback UI upon caught error.
   *
   * @returns State update indicating an error occurred.
   */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   * Logs image rendering error details to console.
   *
   * @param error - The caught image error.
   */
  componentDidCatch(error: Error) {
    console.error("Image Error:", error);
  }

  /**
   * Renders the image fallback placeholder if an error occurred, or renders children.
   *
   * @returns Rendered fallback element or children.
   */
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 w-full h-full min-h-50">
            <div className="text-center p-4">
              <span className="text-4xl">️</span>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {i18n.t("errorFailedLoadImage")}
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
