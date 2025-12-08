/**
 * Centralized query keys for TanStack Query
 * Using factory pattern for type-safe and consistent keys
 */

import type { JobSearchParams } from "@/lib/api/jobs";

export const queryKeys = {
  // Auth keys
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
  },

  // CV keys
  cvs: {
    all: ["cvs"] as const,
    lists: () => [...queryKeys.cvs.all, "list"] as const,
    list: () => [...queryKeys.cvs.lists()] as const,
    details: () => [...queryKeys.cvs.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.cvs.details(), id] as const,
    preview: (id: string) => [...queryKeys.cvs.all, "preview", id] as const,
  },

  // Jobs keys
  jobs: {
    all: ["jobs"] as const,
    searches: () => [...queryKeys.jobs.all, "search"] as const,
    search: (params: JobSearchParams) =>
      [...queryKeys.jobs.searches(), params] as const,
    details: () => [...queryKeys.jobs.all, "detail"] as const,
    detail: (source: string, id: string) =>
      [...queryKeys.jobs.details(), source, id] as const,
    connectors: () => [...queryKeys.jobs.all, "connectors"] as const,
  },
} as const;
