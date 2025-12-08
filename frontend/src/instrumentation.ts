/**
 * Next.js instrumentation file.
 * This runs once when the server starts.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only log on server startup, not in edge runtime
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logger } = await import("@/lib/logger");
    logger.info(
      {
        event: "server_startup",
        nodeEnv: process.env.NODE_ENV,
        logLevel: process.env.LOG_LEVEL || "info",
      },
      "Frontend server started"
    );
  }
}
