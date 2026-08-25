"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component, Suspense } from "react";
import clientLogger from "@/lib/logger/client-logger";
import { i18n } from "@/lib/i18n";

/**
 * Internal state for the ErrorBoundary class component.
 */
interface ErrorBoundaryState {
  /** Indicates whether an error was caught during rendering */
  hasError: boolean;
  /** Caught Error instance */
  error: Error | null;
  /** React error information object containing component stack */
  errorInfo: ErrorInfo | null;
}

/**
 * Properties for configuring the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
  /** Child component subtree protected by the boundary */
  children: ReactNode;
  /** Custom fallback UI element or function receiving error and reset callback */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Callback fired when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Callback fired when the error boundary is reset */
  onReset?: () => void;
}

/**
 * Root React error boundary component that catches rendering errors in child components,
 * logs diagnostics to the client logger, and renders an appropriate fallback interface.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  /**
   * Initializes the ErrorBoundary component with clean error state.
   *
   * @param props - ErrorBoundary configuration properties.
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Updates state so the next render will show the fallback UI.
   *
   * @param error - The error thrown during rendering.
   * @returns Updated partial state object with hasError flag set.
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Catches errors in descendant components, dispatches telemetry logs, and stores error traces.
   *
   * @param error - The thrown error instance.
   * @param errorInfo - Additional component stack details.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    const errorId = crypto.randomUUID();
    clientLogger.logError(error, {
      component: "error-boundary-root",
      action: "error-caught",
      requestId: errorId,
    });

    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error);
      console.error("Component stack:", errorInfo.componentStack);
    }

    try {
      const errorStore = JSON.parse(localStorage.getItem("error-logs") || "[]");
      errorStore.push({
        id: errorId,
        message: error.message,
        timestamp: new Date().toISOString(),
      });

      if (errorStore.length > 10) {
        errorStore.splice(0, errorStore.length - 10);
      }
      localStorage.setItem("error-logs", JSON.stringify(errorStore));
    } catch (storageError) {
      throw new Error(
        `Failed to store error log: ${storageError instanceof Error ? storageError.message : String(storageError)}`,
        { cause: storageError },
      );
    }

    this.props.onError?.(error, errorInfo);
  }

  /**
   * Resets the error boundary state to attempt re-rendering children.
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  /**
   * Renders fallback UI if an error has occurred, or renders children normally.
   *
   * @returns Rendered fallback element or children.
   */
  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function") {
          return this.props.fallback(this.state.error, this.handleReset);
        }
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetAction={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Properties for the DefaultErrorFallback UI component.
 */
interface DefaultErrorFallbackProps {
  /** The caught error object */
  error: Error;
  /** React error information with component stack */
  errorInfo: ErrorInfo | null;
  /** Function to reset error boundary state */
  resetAction: () => void;
}

/**
 * Default full-page or card error fallback UI displaying error details and a retry button.
 *
 * @param props - Fallback properties.
 * @param props.error - Caught error.
 * @param props.errorInfo - React error information.
 * @param props.resetAction - Callback to retry rendering.
 * @returns Rendered fallback UI.
 */
function DefaultErrorFallback({
  error,
  errorInfo,
  resetAction,
}: DefaultErrorFallbackProps): ReactNode {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-100 flex-col items-center justify-center p-8">
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
            {i18n.t("errorSomethingWentWrong")}
          </h2>
        </div>

        <p className="mb-4 text-sm text-red-700 dark:text-red-300">
          {error.message || i18n.t("errorUnexpected")}
        </p>

        {isDev && errorInfo && (
          <details className="mb-4">
            <summary className="cursor-pointer text-xs text-red-600 dark:text-red-400">
              {i18n.t("errorViewDetails")}
            </summary>
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-red-100 p-2 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
              {error.stack}
            </pre>
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-red-100 p-2 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
              {errorInfo.componentStack}
            </pre>
          </details>
        )}

        <button
          onClick={resetAction}
          className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600"
        >
          {i18n.t("errorTryAgain")}
        </button>
      </div>
    </div>
  );
}

/**
 * Compact inline error alert fallback component.
 *
 * @param props - Component properties.
 * @param props.error - Caught error.
 * @param props.resetAction - Callback to retry rendering.
 * @returns Rendered compact error message element.
 */
export function CompactErrorFallback({
  error,
  resetAction,
}: {
  error: Error;
  resetAction: () => void;
}): ReactNode {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
      <p className="mb-2 text-sm text-red-700 dark:text-red-300">
        {error.message || i18n.t("errorSomethingWentWrong")}
      </p>
      <button
        onClick={resetAction}
        className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400"
      >
        {i18n.t("errorTryAgain")}
      </button>
    </div>
  );
}

/**
 * Higher-Order Component (HOC) that wraps any React component with an ErrorBoundary.
 *
 * @param WrappedComponent - Component to protect with an error boundary.
 * @param options - Error boundary configuration options (fallback, onError, onReset).
 * @returns Enhanced component wrapped in ErrorBoundary.
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, "children">,
): React.ComponentType<P> {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";

  const ComponentWithErrorBoundary = (props: P): ReactNode => (
    <ErrorBoundary {...options}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

/**
 * Properties for the AsyncBoundary component.
 */
interface AsyncErrorBoundaryProps extends ErrorBoundaryProps {
  /** Optional custom loading placeholder for React Suspense */
  loadingFallback?: ReactNode;
}

/**
 * Combined boundary component integrating React Suspense and ErrorBoundary for asynchronous components.
 *
 * @param props - Async boundary properties.
 * @param props.children - Child component tree.
 * @param props.loadingFallback - Custom suspense placeholder.
 * @param props.errorBoundaryProps - Additional error boundary options.
 * @returns Rendered boundary structure.
 */
export function AsyncBoundary({
  children,
  loadingFallback,
  ...errorBoundaryProps
}: AsyncErrorBoundaryProps): ReactNode {
  return (
    <ErrorBoundary {...errorBoundaryProps}>
      <Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Default loading spinner fallback for AsyncBoundary.
 *
 * @returns Rendered spinner element.
 */
function DefaultLoadingFallback(): ReactNode {
  return (
    <div className="flex min-h-50 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
    </div>
  );
}
