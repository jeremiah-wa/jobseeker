/**
 * Environment configuration with validation.
 * Similar to Pydantic BaseSettings for Python.
 */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Client-side environment variables (exposed to browser).
   * Must be prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(2),
  },

  /**
   * Server-side environment variables (not exposed to browser).
   * Add sensitive keys here.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Runtime environment values.
   * Must map all variables defined above.
   */
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB: process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB,
    NODE_ENV: process.env.NODE_ENV,
  },

  /**
   * Skip validation in certain environments.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Treat empty strings as undefined.
   */
  emptyStringAsUndefined: true,
});
