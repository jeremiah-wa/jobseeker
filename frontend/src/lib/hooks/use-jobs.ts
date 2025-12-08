/**
 * TanStack Query hooks for job search operations
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { jobsApi, type JobSearchParams } from "@/lib/api/jobs";

/**
 * Hook to search for jobs
 */
export function useJobSearch(
  params: JobSearchParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.jobs.search(params),
    queryFn: () => jobsApi.search(params),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get job details
 */
export function useJob(
  source: string,
  jobId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(source, jobId),
    queryFn: () => jobsApi.getJob(source, jobId),
    enabled: options?.enabled ?? (!!source && !!jobId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to list available connectors
 */
export function useConnectors() {
  return useQuery({
    queryKey: queryKeys.jobs.connectors(),
    queryFn: jobsApi.listConnectors,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
