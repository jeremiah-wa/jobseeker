/**
 * Structured logging configuration using pino.
 *
 * This module configures pino for server-side logging with:
 * - JSON output for log aggregation tools (Docker logs, CloudWatch, etc.)
 * - Request ID correlation with backend via X-Request-ID header
 *
 * Note: We use JSON output in all environments for consistency.
 * Use `docker compose logs` or `pino-pretty` CLI for human-readable output:
 *   docker compose logs frontend | pnpm pino-pretty
 */

import pino from "pino";

const logLevel = process.env.LOG_LEVEL || "info";

/**
 * Base logger configuration.
 * JSON output for log aggregation - pipe through pino-pretty for dev viewing.
 */
export const logger = pino({
  level: logLevel.toLowerCase(),
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
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
