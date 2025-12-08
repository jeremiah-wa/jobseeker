/**
 * Centralized query keys for TanStack Query
 * Using factory pattern for type-safe and consistent keys
 */

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
} as const;
