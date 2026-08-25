import { useState, useRef, useCallback, useEffect } from "react";
import {
  useIntervalManager,
  useMountRef,
  useTimerManager,
} from "./hooks-utils";

/**
 * State tracking security enforcement, rate limiting, and anomaly detection.
 */
interface SecurityState {
  /** Indicates whether the user is currently rate-limited from executing further operations. */
  isRateLimited: boolean;
  /** Cumulative count of detected suspicious activities or anomalous input patterns. */
  suspiciousActivity: number;
  /** Cumulative count of requests or inputs blocked due to security violations. */
  blockedAttempts: number;
  /** Timestamp when the most recent security threat or anomaly occurred. */
  lastThreatTime: Date | null;
}

/**
 * Detailed threat alert record generated upon detecting suspicious or dangerous activity.
 */
interface ThreatAlert {
  /** Unique identifier for the threat alert record. */
  id: string;
  /** Categorization type of the detected security event. */
  type:
    | "rate_limit"
    | "suspicious_input"
    | "repeated_attempts"
    | "dangerous_pattern";
  /** Human-readable explanation of why the threat was flagged. */
  message: string;
  /** Date timestamp when the alert was triggered. */
  timestamp: Date;
  /** Assessed severity level of the detected threat. */
  riskLevel: "low" | "medium" | "high";
  /** Additional contextual diagnostics and execution metadata. */
  metadata: Record<string, unknown>;
}

/**
 * Aggregated analytics and metrics regarding request throughput and threat occurrences.
 */
interface SecurityMetrics {
  /** Total number of requests evaluated within the tracking window. */
  totalRequests: number;
  /** Count of clean, accepted input requests. */
  validRequests: number;
  /** Count of blocked or rejected input requests. */
  blockedRequests: number;
  /** Rolling average throughput of requests per minute over the last 60 seconds. */
  averageRequestsPerMinute: number;
  /** Breakdown of the most frequent threat types and their respective counts. */
  topThreats: Array<{ type: string; count: number }>;
}

/**
 * Result structure returned after evaluating an input string against security heuristics.
 */
interface ValidationResult {
  /** Boolean indicating whether the input passed all safety validations. */
  isValid: boolean;
  /** Sanitized representation of the input string with dangerous elements stripped. */
  sanitizedInput: string;
  /** Description of validation failure, or null if valid. */
  error: string | null;
  /** Evaluated risk level of the input content. */
  riskLevel: "low" | "medium" | "high";
}

/**
 * Thresholds, capacities, and timing constants for client-side security defense.
 */
const SECURITY_LIMITS = {
  MAX_RECENT_INPUTS: 50,
  MAX_ALERTS: 10,
  RATE_LIMIT_TIMEOUT: 60000,
  CLEANUP_INTERVAL: 300000,
  ONE_HOUR: 3600000,
} as const;

/**
 * Verifies whether execution is currently occurring within a client browser environment.
 *
 * @returns True if `window` object is defined.
 */
const isClientSide = () => typeof window !== "undefined";

/**
 * Wraps an operation in a try-catch block and returns a fallback value upon error.
 *
 * @template T - Return type of the protected function.
 * @param fn - The function to execute safely.
 * @param fallback - The default value to return if `fn` throws an error.
 * @returns A safe function returning either the computation result or the fallback.
 */
const withErrorHandling = <T>(fn: () => T, fallback: T): (() => T) => {
  return () => {
    try {
      return fn();
    } catch (error) {
      console.error("Security operation failed:", error);
      return fallback;
    }
  };
};

/**
 * Evaluates an input string against regular expressions for dangerous injection attacks (XSS, script tags, cookie theft, eval).
 *
 * @param input - The raw command or text string to inspect.
 * @returns A {@link ValidationResult} indicating validity, sanitized text, error reason, and risk level.
 */
function validateInputClientSide(input: string): ValidationResult {
  const sanitizedInput = input.trim();

  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\(/i,
    /document\.cookie/i,
    /window\./i,
    /data:\s*text\/html/i,
    /import\s*\(/i,
    /constructor\s*[[(]/i,
    /Function\s*\(/i,
    /\.innerHTML\s*=/i,
    /\.outerHTML\s*=/i,
    /fromCharCode/i,
    /&#x?[0-9a-f]+;/i,
    /\\u00[0-9a-f]{2}/i,
    /\bfetch\s*\(/i,
    /XMLHttpRequest/i,
  ];

  const hasDangerousPattern = dangerousPatterns.some((pattern) =>
    pattern.test(sanitizedInput),
  );

  if (hasDangerousPattern) {
    return {
      isValid: false,
      sanitizedInput: sanitizedInput.replace(/<[^>]*>/g, ""),
      error: "Potentially dangerous input detected",
      riskLevel: "high",
    };
  }

  if (sanitizedInput.length > 500) {
    return {
      isValid: false,
      sanitizedInput: sanitizedInput.substring(0, 500),
      error: "Input too long",
      riskLevel: "medium",
    };
  }

  return {
    isValid: true,
    sanitizedInput,
    error: null,
    riskLevel: "low",
  };
}

/**
 * Represents an input string bundled with its submission epoch timestamp.
 */
export interface TimestampedInput {
  /** The recorded command or query text. */
  input: string;
  /** Milliseconds epoch timestamp when the input was received. */
  timestamp: number;
}

/**
 * Custom React hook providing client-side security validation, rate limiting, and anomaly tracking.
 *
 * Scans terminal inputs for injection payloads, tracks burst command rates, throttles abuse,
 * and maintains rolling threat metrics and actionable security recommendations.
 *
 * @returns An object containing security state, validation methods, threat alerts, and diagnostics:
 * - `securityState`: Current {@link SecurityState} tracking rate limits and anomaly counts.
 * - `threatAlerts`: List of recent {@link ThreatAlert} entries.
 * - `validateInput`: Asynchronous validator inspecting input for malicious patterns and tracking metrics.
 * - `validateInputSync`: Synchronous validator variant for immediate inline checks.
 * - `resetRateLimit`: Manually lifts the active rate limit lockout.
 * - `getSecurityMetrics`: Generates computed {@link SecurityMetrics} summarizing request activity.
 * - `getSecurityRecommendations`: Returns contextual security guidance based on recent metrics.
 * - `clearOldAlerts`: Purges alerts older than one hour.
 * - `isSecure`: Boolean indicating whether current session is deemed safe and non-rate-limited.
 * - `riskLevel`: Overall calculated risk tier ('low' | 'medium' | 'high').
 *
 * @example
 * ```tsx
 * const { validateInput, isRateLimited, threatAlerts } = useSecurity();
 *
 * const handleSubmit = async (cmd: string) => {
 *   const res = await validateInput(cmd);
 *   if (!res.shouldProceed) {
 *     showError(res.error);
 *     return;
 *   }
 *   execute(res.sanitizedInput);
 * };
 * ```
 */
export function useSecurity() {
  const isMountedRef = useMountRef();
  const { setTimer, clearTimer } = useTimerManager();
  const { setInterval, clearInterval } = useIntervalManager();

  const [securityState, setSecurityState] = useState<SecurityState>({
    isRateLimited: false,
    suspiciousActivity: 0,
    blockedAttempts: 0,
    lastThreatTime: null,
  });

  const [threatAlerts, setThreatAlerts] = useState<ThreatAlert[]>([]);
  const recentInputs = useRef<TimestampedInput[]>([]);
  const requestHistory = useRef<Array<{ timestamp: number; valid: boolean }>>(
    [],
  );

  const metricsCache = useRef<{
    timestamp: number;
    metrics: SecurityMetrics;
  } | null>(null);
  const CACHE_DURATION = 5000;

  const validateInput = useCallback(
    async (
      input: string,
    ): Promise<
      ValidationResult & {
        shouldProceed: boolean;
        alert?: ThreatAlert;
      }
    > => {
      try {
        if (securityState.isRateLimited) {
          return {
            isValid: false,
            sanitizedInput: "",
            error: "Rate limited. Please wait before trying again.",
            riskLevel: "high",
            shouldProceed: false,
          };
        }

        const validation: ValidationResult = validateInputClientSide(input);
        let shouldProceed = validation.isValid;
        let alert: ThreatAlert | undefined;

        if (isClientSide() && isMountedRef.current) {
          const now = Date.now();
          recentInputs.current.push({ input, timestamp: now });
          if (recentInputs.current.length > SECURITY_LIMITS.MAX_RECENT_INPUTS) {
            recentInputs.current = recentInputs.current.slice(
              -SECURITY_LIMITS.MAX_RECENT_INPUTS,
            );
          }

          requestHistory.current.push({
            timestamp: now,
            valid: validation.isValid,
          });

          const oneHourAgo = now - SECURITY_LIMITS.ONE_HOUR;
          if (requestHistory.current.length > 100) {
            requestHistory.current = requestHistory.current.filter(
              (record) => record.timestamp > oneHourAgo,
            );
          }

          if (recentInputs.current.length >= 5) {
            const suspiciousAnalysis = detectSuspiciousActivity(
              recentInputs.current.slice(-10),
            );

            if (suspiciousAnalysis.isSuspicious) {
              alert = createThreatAlert(
                "suspicious_input",
                suspiciousAnalysis.reason,
                suspiciousAnalysis.riskLevel,
                {
                  pattern: suspiciousAnalysis.reason,
                  recentInputs: recentInputs.current
                    .slice(-5)
                    .map((i) => i.input),
                },
              );

              if (isMountedRef.current) {
                setSecurityState((prev) => ({
                  ...prev,
                  suspiciousActivity: prev.suspiciousActivity + 1,
                  blockedAttempts:
                    prev.blockedAttempts +
                    (suspiciousAnalysis.riskLevel === "high" ? 1 : 0),
                  isRateLimited:
                    prev.isRateLimited ||
                    suspiciousAnalysis.riskLevel === "high",
                  lastThreatTime: new Date(),
                }));

                if (suspiciousAnalysis.riskLevel === "high") {
                  shouldProceed = false;
                }
              }
            }
          }

          if (alert && isMountedRef.current) {
            setThreatAlerts((prev) => [
              ...prev.slice(-SECURITY_LIMITS.MAX_ALERTS + 1),
              alert!,
            ]);
          }
        }

        return {
          ...validation,
          shouldProceed,
          alert,
        };
      } catch (error) {
        console.error("Security validation failed:", error);
        return {
          shouldProceed: false,
          isValid: false,
          sanitizedInput: "",
          error: "Security validation failed",
          riskLevel: "high" as const,
        };
      }
    },
    [isMountedRef, securityState.isRateLimited],
  );

  const validateInputSync = useCallback(
    (
      input: string,
    ): ValidationResult & {
      shouldProceed: boolean;
      alert?: ThreatAlert;
    } => {
      try {
        if (securityState.isRateLimited) {
          return {
            isValid: false,
            sanitizedInput: "",
            error: "Rate limited. Please wait before trying again.",
            riskLevel: "high",
            shouldProceed: false,
          };
        }

        const validation = validateInputClientSide(input);
        let shouldProceed = validation.isValid;
        let alert: ThreatAlert | undefined;

        if (isClientSide() && isMountedRef.current) {
          const now = Date.now();
          recentInputs.current.push({ input, timestamp: now });
          if (recentInputs.current.length > SECURITY_LIMITS.MAX_RECENT_INPUTS) {
            recentInputs.current = recentInputs.current.slice(
              -SECURITY_LIMITS.MAX_RECENT_INPUTS,
            );
          }

          requestHistory.current.push({
            timestamp: now,
            valid: validation.isValid,
          });

          const oneHourAgo = now - SECURITY_LIMITS.ONE_HOUR;
          if (requestHistory.current.length > 100) {
            requestHistory.current = requestHistory.current.filter(
              (record) => record.timestamp > oneHourAgo,
            );
          }

          if (recentInputs.current.length >= 5) {
            const suspiciousAnalysis = detectSuspiciousActivity(
              recentInputs.current.slice(-10),
            );

            if (suspiciousAnalysis.isSuspicious) {
              alert = createThreatAlert(
                "suspicious_input",
                suspiciousAnalysis.reason,
                suspiciousAnalysis.riskLevel,
                {
                  pattern: suspiciousAnalysis.reason,
                  recentInputs: recentInputs.current
                    .slice(-5)
                    .map((i) => i.input),
                },
              );

              if (isMountedRef.current) {
                setSecurityState((prev) => ({
                  ...prev,
                  suspiciousActivity: prev.suspiciousActivity + 1,
                  blockedAttempts:
                    prev.blockedAttempts +
                    (suspiciousAnalysis.riskLevel === "high" ? 1 : 0),
                  isRateLimited:
                    prev.isRateLimited ||
                    suspiciousAnalysis.riskLevel === "high",
                  lastThreatTime: new Date(),
                }));

                if (suspiciousAnalysis.riskLevel === "high") {
                  shouldProceed = false;
                }
              }
            }
          }

          if (alert && isMountedRef.current) {
            setThreatAlerts((prev) => [
              ...prev.slice(-SECURITY_LIMITS.MAX_ALERTS + 1),
              alert!,
            ]);
          }
        }

        return {
          ...validation,
          shouldProceed,
          alert,
        };
      } catch (error) {
        console.error("Security validation sync failed:", error);
        return {
          shouldProceed: false,
          isValid: false,
          sanitizedInput: "",
          error: "Security validation failed",
          riskLevel: "high" as const,
        };
      }
    },
    [isMountedRef, securityState.isRateLimited],
  );

  const resetRateLimit = useCallback(() => {
    if (!isMountedRef.current) return;

    setSecurityState((prev) => ({
      ...prev,
      isRateLimited: false,
    }));
  }, [isMountedRef]);

  const getSecurityMetrics = useCallback((): SecurityMetrics => {
    if (!isClientSide()) {
      return {
        totalRequests: 0,
        validRequests: 0,
        blockedRequests: 0,
        averageRequestsPerMinute: 0,
        topThreats: [],
      };
    }

    const now = Date.now();
    if (
      metricsCache.current &&
      now - metricsCache.current.timestamp < CACHE_DURATION
    ) {
      return metricsCache.current.metrics;
    }

    return withErrorHandling(
      () => {
        const totalRequests = requestHistory.current.length;
        const validRequests = requestHistory.current.filter(
          (r) => r.valid,
        ).length;
        const blockedRequests = totalRequests - validRequests;

        const oneMinuteAgo = now - 60000;
        const recentRequests = requestHistory.current.filter(
          (r) => r.timestamp > oneMinuteAgo,
        );

        const averageRequestsPerMinute = recentRequests.length;

        const threatTypes = threatAlerts.reduce(
          (counts, alert) => {
            counts[alert.type] = (counts[alert.type] || 0) + 1;
            return counts;
          },
          {} as Record<string, number>,
        );

        const topThreats = Object.entries(threatTypes)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        const metrics = {
          totalRequests,
          validRequests,
          blockedRequests,
          averageRequestsPerMinute,
          topThreats,
        };

        metricsCache.current = {
          timestamp: now,
          metrics,
        };

        return metrics;
      },
      {
        totalRequests: 0,
        validRequests: 0,
        blockedRequests: 0,
        averageRequestsPerMinute: 0,
        topThreats: [],
      },
    )();
  }, [threatAlerts]);

  const clearOldAlerts = useCallback(() => {
    if (!isClientSide() || !isMountedRef.current) return;

    withErrorHandling(() => {
      const oneHourAgo = Date.now() - SECURITY_LIMITS.ONE_HOUR;
      setThreatAlerts((prev) => {
        const filtered = prev.filter(
          (alert) => alert.timestamp.getTime() > oneHourAgo,
        );
        return filtered.length !== prev.length ? filtered : prev;
      });

      if (metricsCache.current) {
        metricsCache.current = null;
      }
    }, undefined)();
  }, [isMountedRef]);

  const getSecurityRecommendations = useCallback((): string[] => {
    return withErrorHandling(() => {
      const recommendations: string[] = [];
      const metrics = getSecurityMetrics();

      if (securityState.isRateLimited) {
        recommendations.push(
          "Rate limiting is active. Wait a moment before trying again.",
        );
      }

      if (securityState.suspiciousActivity > 5) {
        recommendations.push(
          "High suspicious activity detected. Consider clearing session.",
        );
      }

      if (metrics.blockedRequests > metrics.validRequests) {
        recommendations.push(
          "Many requests are being blocked. Check your input format.",
        );
      }

      if (metrics.averageRequestsPerMinute > 20) {
        recommendations.push(
          "High request frequency detected. Consider slowing down.",
        );
      }

      return recommendations;
    }, [])();
  }, [securityState, getSecurityMetrics]);

  useEffect(() => {
    if (!isClientSide() || !isMountedRef.current) return;

    if (securityState.isRateLimited) {
      setTimer(
        "rateLimitReset",
        () => {
          if (isMountedRef.current) {
            resetRateLimit();
          }
        },
        SECURITY_LIMITS.RATE_LIMIT_TIMEOUT,
      );
    } else {
      clearTimer("rateLimitReset");
    }
  }, [
    securityState.isRateLimited,
    resetRateLimit,
    isMountedRef,
    setTimer,
    clearTimer,
  ]);

  useEffect(() => {
    if (!isClientSide() || !isMountedRef.current) return;

    setInterval(
      "alertCleanup",
      () => {
        if (isMountedRef.current) {
          clearOldAlerts();
        }
      },
      SECURITY_LIMITS.CLEANUP_INTERVAL,
    );

    return () => clearInterval("alertCleanup");
  }, [clearOldAlerts, isMountedRef, setInterval, clearInterval]);

  useEffect(() => {
    return () => {
      recentInputs.current = [];
      requestHistory.current = [];
      metricsCache.current = null;
    };
  }, []);

  return {
    securityState,
    threatAlerts,

    validateInput,
    validateInputSync,
    resetRateLimit,
    getSecurityMetrics,
    getSecurityRecommendations,
    clearOldAlerts,

    isSecure:
      securityState.suspiciousActivity < 3 && !securityState.isRateLimited,
    riskLevel:
      securityState.suspiciousActivity > 10
        ? "high"
        : securityState.suspiciousActivity > 5
          ? "medium"
          : "low",
  };
}

/**
 * Instantiates a new structured threat alert item.
 *
 * @param type - Category of threat identified.
 * @param message - Diagnostic message describing the anomaly.
 * @param riskLevel - Assessed risk severity.
 * @param metadata - Supplementary data and state parameters.
 * @returns A fully initialized {@link ThreatAlert} object.
 */
function createThreatAlert(
  type: ThreatAlert["type"],
  message: string,
  riskLevel: ThreatAlert["riskLevel"],
  metadata: Record<string, unknown> = {},
): ThreatAlert {
  const id =
    typeof window !== "undefined"
      ? `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : `alert_${type}_${Date.now()}`;

  const timestamp = new Date();

  return {
    id,
    type,
    message,
    timestamp,
    riskLevel,
    metadata,
  };
}

/**
 * Analyzes a historical list of recent inputs for anomalous behavior patterns such as rapid burst submission or repeated spamming.
 *
 * @param recentInputs - Array of input strings or timestamped input objects to examine.
 * @returns An evaluation object detailing suspicion status, reason explanation, and assessed risk level.
 *
 * @example
 * ```ts
 * const analysis = detectSuspiciousActivity(["help", "help", "help", "help"]);
 * if (analysis.isSuspicious) {
 *   console.warn(analysis.reason);
 * }
 * ```
 */
export function detectSuspiciousActivity(
  recentInputs: Array<string | TimestampedInput>,
): {
  isSuspicious: boolean;
  reason: string;
  riskLevel: "low" | "medium" | "high";
} {
  if (recentInputs.length < 3) {
    return { isSuspicious: false, reason: "", riskLevel: "low" };
  }

  const now = Date.now();
  const normalizedInputs: TimestampedInput[] = recentInputs.map((item) =>
    typeof item === "string" ? { input: item, timestamp: now } : item,
  );

  const fiveSecondsAgo = now - 5000;
  const inputsInLast5s = normalizedInputs.filter(
    (item) => item.timestamp >= fiveSecondsAgo,
  );

  if (inputsInLast5s.length > 15) {
    return {
      isSuspicious: true,
      reason: "Extreme rapid input burst detected",
      riskLevel: "high",
    };
  }
  if (inputsInLast5s.length > 8) {
    return {
      isSuspicious: true,
      reason: "Rapid input pattern detected",
      riskLevel: "medium",
    };
  }

  const patternCounts: Record<string, number> = {};
  normalizedInputs.forEach((item) => {
    const normalized = item.input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s]/g, "");
    const key = normalized || item.input.toLowerCase().trim();
    patternCounts[key] = (patternCounts[key] || 0) + 1;
  });

  const maxRepetition = Math.max(0, ...Object.values(patternCounts));
  if (maxRepetition > 5) {
    return {
      isSuspicious: true,
      reason: "Excessive input repetition detected",
      riskLevel: "high",
    };
  }
  if (maxRepetition > 3) {
    return {
      isSuspicious: true,
      reason: "Excessive input repetition detected",
      riskLevel: "medium",
    };
  }

  return { isSuspicious: false, reason: "", riskLevel: "low" };
}

/**
 * Diagnostic monitoring hook that periodically logs security diagnostics and active metrics to console during development.
 *
 * @returns The active {@link useSecurity} instance.
 *
 * @example
 * ```tsx
 * function App() {
 *   useSecurityMonitoring();
 *   return <Terminal />;
 * }
 * ```
 */
export function useSecurityMonitoring() {
  const security = useSecurity();

  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined"
    ) {
      const interval = setInterval(() => {
        try {
          const metrics = security.getSecurityMetrics();
          if (metrics.blockedRequests > 0 || security.threatAlerts.length > 0) {
            console.group("Security Monitoring");
            console.log("Metrics:", metrics);
            console.log("Recent Threats:", security.threatAlerts.slice(-3));
            console.log(
              "Recommendations:",
              security.getSecurityRecommendations(),
            );
            console.groupEnd();
          }
        } catch (error) {
          console.warn("Security monitoring error:", error);
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [security]);

  return security;
}
