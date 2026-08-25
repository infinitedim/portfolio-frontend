import type { ComponentType, ErrorInfo, ReactNode } from "react";
import { Component, useCallback, useEffect, useState } from "react";
import {
  EnhancedError,
  ErrorCategory,
  ErrorSeverity,
  ErrorRecoveryStrategy,
  ErrorUtils,
} from "./error-types";
import clientLogger from "../logger/client-logger";

/**
 * State structure for the EnhancedErrorBoundary component.
 */
export interface ErrorBoundaryState {
  /** Indicates whether an error was captured by the boundary */
  hasError: boolean;
  /** The normalized enhanced error instance, or null if no error */
  error: EnhancedError | null;
  /** React component stack error info, or null */
  errorInfo: ErrorInfo | null;
  /** Unique identifier generated for the captured error */
  errorId: string;
  /** Number of retry attempts executed so far */
  retryCount: number;
}

/**
 * Configuration options for the EnhancedErrorBoundary component.
 */
export interface ErrorBoundaryConfig {
  /** Custom fallback render function receiving error state and recovery callbacks */
  fallback?: (
    error: EnhancedError,
    errorInfo: ErrorInfo,
    retry: () => void,
    reset: () => void,
  ) => ReactNode;
  /** Callback fired when an error is caught */
  onError?: (error: EnhancedError, errorInfo: ErrorInfo) => void;
  /** Callback fired when a retry attempt is triggered */
  onRetry?: (error: EnhancedError, attempt: number) => void;
  /** Maximum number of retry attempts before giving up */
  maxRetries?: number;
  /** Flag indicating whether errors should be isolated to this boundary */
  isolateErrors?: boolean;
  /** Flag to enable automatic retry recovery for retryable errors */
  enableRecovery?: boolean;
  /** Default error category to categorize caught errors under */
  category?: ErrorCategory;
  /** Whether to report caught errors to the logger and session storage */
  reportErrors?: boolean;
}

/**
 * Enhanced React Error Boundary class component that catches rendering errors,
 * normalizes them into EnhancedError instances, provides retry mechanisms, and logs errors.
 */
export class EnhancedErrorBoundary extends Component<
  ErrorBoundaryConfig & { children: ReactNode },
  ErrorBoundaryState
> {
  private retryTimeouts: NodeJS.Timeout[] = [];
  private readonly maxRetries: number;

  /**
   * Initializes the EnhancedErrorBoundary with props and initial state.
   * @param props - Component props including ErrorBoundaryConfig and children
   */
  constructor(props: ErrorBoundaryConfig & { children: ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
      retryCount: 0,
    };
    this.maxRetries = props.maxRetries || 3;
  }

  /**
   * React lifecycle method to derive state from a thrown error.
   * @param error - The raw error thrown by a child component
   * @returns Partial state update with error flags and enhanced error
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const enhancedError = ErrorUtils.enhance(error);

    return {
      hasError: true,
      error: enhancedError,
      errorId,
    };
  }

  /**
   * React lifecycle method called after an error has been thrown by a descendant component.
   * @param error - The error thrown by descendant components
   * @param errorInfo - React error info containing component stack trace
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const enhancedError = ErrorUtils.enhance(error, {
      category: this.props.category,
      context: {
        timestamp: new Date(),
        additionalData: {
          componentStack: errorInfo.componentStack,
          errorBoundary: this.constructor.name,
        },
      },
    });

    this.setState({
      error: enhancedError,
      errorInfo,
    });

    if (this.props.reportErrors !== false) {
      this.reportError(enhancedError, errorInfo);
    }

    this.props.onError?.(enhancedError, errorInfo);

    if (this.props.enableRecovery && enhancedError.isRetryable) {
      this.scheduleRetry();
    }
  }

  /**
   * Reports the error to clientLogger, development console, and session storage.
   * @param error - The enhanced error instance to report
   * @param errorInfo - Component stack information
   */
  private reportError = (error: EnhancedError, errorInfo: ErrorInfo) => {
    try {
      clientLogger.logError(error, {
        component: "error-boundary",
        action: "error-caught",
      });

      if (process.env.NODE_ENV === "development") {
        console.group(`Error Boundary: ${error.category}`);
        console.error("Error:", error);
        console.error("Component Stack:", errorInfo.componentStack);
        console.error("Error Info:", errorInfo);
        console.groupEnd();
      }

      const errorReport = {
        id: error.id,
        message: error.message,
        category: error.category,
        severity: error.severity,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      try {
        const existingReports = JSON.parse(
          sessionStorage.getItem("errorReports") || "[]",
        );
        existingReports.push(errorReport);
        if (existingReports.length > 10) {
          existingReports.splice(0, existingReports.length - 10);
        }
        sessionStorage.setItem("errorReports", JSON.stringify(existingReports));
      } catch (storageError) {
        console.warn("Failed to store error report:", storageError);
        clientLogger.warn(
          "Failed to store error report in sessionStorage",
          {
            component: "error-boundary",
          },
          { error: storageError },
        );
      }
    } catch (reportingError) {
      console.error("Failed to report error:", reportingError);
      clientLogger.error("Failed to report error", reportingError, {
        component: "error-boundary",
      });
    }
  };

  /**
   * Schedules an automatic retry with exponential backoff delay.
   */
  private scheduleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000);
    const timeout = setTimeout(() => {
      this.retry();
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  /**
   * Increments retry count and clears the error state to trigger a re-render.
   */
  private retry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState((prevState) => ({
      ...prevState,
      retryCount: prevState.retryCount + 1,
    }));

    this.props.onRetry?.(this.state.error!, this.state.retryCount + 1);

    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: "",
        retryCount: this.state.retryCount,
      });
    }, 100);
  };

  /**
   * Clears active timeouts and resets error state to initial conditions.
   */
  private reset = () => {
    this.retryTimeouts.forEach(clearTimeout);
    this.retryTimeouts = [];

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
      retryCount: 0,
    });
  };

  /**
   * Cleans up pending retry timers when the component unmounts.
   */
  componentWillUnmount() {
    this.retryTimeouts.forEach(clearTimeout);
  }

  /**
   * Renders fallback UI if an error has been caught, otherwise renders children.
   * @returns Fallback UI or child elements
   */
  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo!,
          this.retry,
          this.reset,
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retryCount={this.state.retryCount}
          maxRetries={this.maxRetries}
          onRetry={this.retry}
          onReset={this.reset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Props for the DefaultErrorFallback presentation component.
 */
interface DefaultErrorFallbackProps {
  /** The enhanced error details */
  error: EnhancedError;
  /** Component stack error information */
  errorInfo: ErrorInfo | null;
  /** Current retry attempt count */
  retryCount: number;
  /** Maximum retry attempts configured */
  maxRetries: number;
  /** Callback to trigger a retry */
  onRetry: () => void;
  /** Callback to reset the error boundary */
  onReset: () => void;
}

/**
 * Default fallback UI displayed when an uncaught error occurs in the boundary.
 * @param props - Fallback properties containing error details and recovery actions
 * @param props.error - The enhanced error details
 * @param props.errorInfo - Component stack error information
 * @param props.retryCount - Current retry attempt count
 * @param props.maxRetries - Maximum retry attempts configured
 * @param props.onRetry - Callback to trigger a retry
 * @param props.onReset - Callback to reset the error boundary
 * @returns Rendered error fallback interface
 */
function DefaultErrorFallback({
  error,
  errorInfo,
  retryCount,
  maxRetries,
  onRetry,
  onReset,
}: DefaultErrorFallbackProps) {
  const canRetry = error.isRetryable && retryCount < maxRetries;

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return "text-red-600 bg-red-50 border-red-200";
      case ErrorSeverity.HIGH:
        return "text-orange-600 bg-orange-50 border-orange-200";
      case ErrorSeverity.MEDIUM:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case ErrorSeverity.LOW:
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRecoveryActions = (strategy: ErrorRecoveryStrategy) => {
    switch (strategy) {
      case ErrorRecoveryStrategy.RETRY:
        return canRetry ? (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry ({maxRetries - retryCount} attempts left)
          </button>
        ) : null;

      case ErrorRecoveryStrategy.REFRESH:
        return (
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Refresh Page
          </button>
        );

      case ErrorRecoveryStrategy.REDIRECT:
        return (
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Go to Home
          </button>
        );

      default:
        return (
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-6">
        <div
          className={`p-4 rounded-lg border ${getSeverityColor(error.severity)}`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-2xl">️</span>
            <div>
              <h1 className="text-lg font-semibold">{error.category} Error</h1>
              <p className="text-sm opacity-75">Severity: {error.severity}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-2">Error Details</h3>
          <p className="text-sm text-gray-600 mb-3">{error.message}</p>

          {retryCount > 0 && (
            <p className="text-xs text-gray-500">
              Retry attempt: {retryCount}/{maxRetries}
            </p>
          )}
        </div>

        {error.suggestions.length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-2">Suggestions</h3>
            <ul className="space-y-1">
              {error.suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 flex items-start"
                >
                  <span className="text-gray-400 mr-2">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col space-y-2">
          {getRecoveryActions(error.recoveryStrategy)}

          {canRetry && (
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {process.env.NODE_ENV === "development" && errorInfo && (
          <details className="bg-gray-100 p-3 rounded text-xs">
            <summary className="cursor-pointer font-medium">
              Debug Information
            </summary>
            <div className="mt-2 space-y-2">
              <div>
                <strong>Error ID:</strong> {error.id}
              </div>
              <div>
                <strong>Stack Trace:</strong>
                <pre className="mt-1 text-xs bg-white p-2 rounded overflow-auto">
                  {error.stack}
                </pre>
              </div>
              <div>
                <strong>Component Stack:</strong>
                <pre className="mt-1 text-xs bg-white p-2 rounded overflow-auto">
                  {errorInfo.componentStack}
                </pre>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Higher-order component that wraps a given component with an EnhancedErrorBoundary.
 * @param Component - Target React component to wrap
 * @param config - Optional configuration for the error boundary
 * @returns Wrapped component with error boundary protection
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  config: ErrorBoundaryConfig = {},
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...config}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook to imperatively trigger an error boundary from within a component.
 * @returns An object containing `captureError` and `resetError` methods
 */
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureError = useCallback((error: Error | string) => {
    const errorObj = typeof error === "string" ? new Error(error) : error;
    setError(errorObj);
  }, []);

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    captureError,
    resetError,
  };
}
