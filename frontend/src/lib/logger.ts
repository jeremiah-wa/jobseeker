/**
 * Structured logging configuration using pino.
 *
 * This module configures pino for server-side logging with:
 * - JSON output in production (for log aggregation tools like Docker logs)
 * - Human-readable colored output in development
 * - Request ID correlation with backend via X-Request-ID header
 */

import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";
const logLevel = process.env.LOG_LEVEL || "info";

/**
 * Base logger configuration.
 * In development: pretty-printed, colored output
 * In production: JSON output for log aggregation
 */
export const logger = pino({
  level: logLevel.toLowerCase(),
  ...(isDevelopment
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {
        // Production: JSON output
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
});

/**
 * Create a child logger with bound context.
 * Use this to add request-scoped context like request_id.
 *
 * @param context - Key-value pairs to bind to the logger
 * @returns A child logger with bound context
 *
 * @example
 * ```ts
 * const reqLogger = createLogger({ request_id: "abc-123", path: "/api/jobs" });
 * reqLogger.info("Request started");
 * ```
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Log levels available:
 * - trace: Very detailed debugging
 * - debug: Debugging information
 * - info: Normal operation events
 * - warn: Warning conditions
 * - error: Error conditions
 * - fatal: System is unusable
 */
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
