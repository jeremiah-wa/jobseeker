/**
 * Hook for managing job search parameters in URL
 */

"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { JobSearchParams, JobType } from "@/lib/api/jobs";
import type { FilterValues } from "@/lib/components/jobs/filter-panel";

const DEFAULT_PER_PAGE = 20;
const DEFAULT_LOCATION = "Melbourne, Australia";

export function useJobSearchParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse current params from URL (with default location)
  const params = useMemo((): JobSearchParams => {
    return {
      q: searchParams.get("q") || undefined,
      location: searchParams.get("location") || DEFAULT_LOCATION,
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
      salaryMin: searchParams.get("salary_min") || "",
      salaryMax: searchParams.get("salary_max") || "",
      jobType: (searchParams.get("job_type") as JobType | "") || "",
      remote: searchParams.get("remote") === "true",
    };
  }, [searchParams]);

  // Get search keywords
  const keywords = useMemo(() => searchParams.get("q") || "", [searchParams]);

  // Get location (with default)
  const location = useMemo(
    () => searchParams.get("location") || DEFAULT_LOCATION,
    [searchParams]
  );

  // Get current page
  const page = useMemo(
    () =>
      searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
    [searchParams]
  );

  // Update URL params
  const updateParams = useCallback(
    (updates: Partial<JobSearchParams & { q: string }>, resetPage = true) => {
      const newParams = new URLSearchParams(searchParams.toString());

      // Reset page when filters change (unless explicitly disabled)
      if (resetPage && !("page" in updates)) {
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

  // Search with keywords and location
  const search = useCallback(
    (q: string, loc: string) => {
      updateParams({
        q: q || undefined,
        location: loc || undefined,
      });
    },
    [updateParams]
  );

  // Update a single filter (triggers immediate search)
  const setFilter = useCallback(
    (key: keyof FilterValues, value: FilterValues[keyof FilterValues]) => {
      const paramKey =
        key === "salaryMin"
          ? "salary_min"
          : key === "salaryMax"
            ? "salary_max"
            : key === "jobType"
              ? "job_type"
              : key;

      if (key === "salaryMin" || key === "salaryMax") {
        updateParams({
          [paramKey]: value ? parseInt(value as string, 10) : undefined,
        });
      } else {
        updateParams({ [paramKey]: value || undefined });
      }
    },
    [updateParams]
  );

  // Clear all filters (keep search terms)
  const clearFilters = useCallback(() => {
    const newParams = new URLSearchParams();
    const q = searchParams.get("q");
    const loc = searchParams.get("location");
    if (q) newParams.set("q", q);
    if (loc) newParams.set("location", loc);
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Set page
  const setPage = useCallback(
    (newPage: number) => {
      updateParams({ page: newPage > 1 ? newPage : undefined }, false);
    },
    [updateParams]
  );

  return {
    params,
    keywords,
    location,
    filterValues,
    page,
    search,
    setFilter,
    clearFilters,
    setPage,
  };
}
