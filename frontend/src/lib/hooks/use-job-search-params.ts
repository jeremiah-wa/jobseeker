/**
 * Hook for managing job search parameters in URL
 */

"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { JobSearchParams, JobType } from "@/lib/api/jobs";
import type { FilterValues } from "@/lib/components/jobs/filter-panel";

const DEFAULT_PER_PAGE = 20;

export function useJobSearchParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse current params from URL
  const params = useMemo((): JobSearchParams => {
    return {
      q: searchParams.get("q") || undefined,
      location: searchParams.get("location") || undefined,
      salary_min: searchParams.get("salary_min")
        ? parseInt(searchParams.get("salary_min")!, 10)
        : undefined,
      salary_max: searchParams.get("salary_max")
        ? parseInt(searchParams.get("salary_max")!, 10)
        : undefined,
      job_type: (searchParams.get("job_type") as JobType) || undefined,
      remote: searchParams.get("remote") === "true" ? true : undefined,
      page: searchParams.get("page")
        ? parseInt(searchParams.get("page")!, 10)
        : 1,
      per_page: DEFAULT_PER_PAGE,
    };
  }, [searchParams]);

  // Get filter values for FilterPanel
  const filterValues = useMemo((): FilterValues => {
    return {
      location: searchParams.get("location") || "",
      salaryMin: searchParams.get("salary_min") || "",
      salaryMax: searchParams.get("salary_max") || "",
      jobType: (searchParams.get("job_type") as JobType | "") || "",
      remote: searchParams.get("remote") === "true",
    };
  }, [searchParams]);

  // Get search query
  const query = useMemo(() => searchParams.get("q") || "", [searchParams]);

  // Get current page
  const page = useMemo(
    () =>
      searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
    [searchParams]
  );

  // Update URL params
  const updateParams = useCallback(
    (updates: Partial<JobSearchParams & { q: string }>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      // Reset page when filters change (unless page is explicitly set)
      if (!("page" in updates)) {
        newParams.delete("page");
      }

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      });

      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Set search query
  const setQuery = useCallback(
    (q: string) => {
      updateParams({ q: q || undefined });
    },
    [updateParams]
  );

  // Set filters
  const setFilters = useCallback(
    (filters: FilterValues) => {
      updateParams({
        location: filters.location || undefined,
        salary_min: filters.salaryMin
          ? parseInt(filters.salaryMin, 10)
          : undefined,
        salary_max: filters.salaryMax
          ? parseInt(filters.salaryMax, 10)
          : undefined,
        job_type: filters.jobType || undefined,
        remote: filters.remote || undefined,
      });
    },
    [updateParams]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    const newParams = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) newParams.set("q", q);
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Set page
  const setPage = useCallback(
    (newPage: number) => {
      updateParams({ page: newPage > 1 ? newPage : undefined });
    },
    [updateParams]
  );

  return {
    params,
    query,
    filterValues,
    page,
    setQuery,
    setFilters,
    clearFilters,
    setPage,
  };
}
