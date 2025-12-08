/**
 * Job search page
 */

"use client";

import { Suspense, useState } from "react";
import {
  SearchBar,
  FilterPanel,
  JobList,
  JobDetailModal,
} from "@/lib/components/jobs";
import { useJobSearch } from "@/lib/hooks/use-jobs";
import { useJobSearchParams } from "@/lib/hooks/use-job-search-params";
import type { Job } from "@/lib/api/jobs";
import { Briefcase, SlidersHorizontal } from "lucide-react";
import { Button } from "@/lib/components/ui/button";

function JobSearchContent() {
  const {
    params,
    keywords,
    location,
    filterValues,
    page,
    search,
    setFilter,
    clearFilters,
    setPage,
  } = useJobSearchParams();

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useJobSearch(params);

  return (
    <>
      {/* Search Header */}
      <div className="border-b border-border bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">
              Job Search
            </h1>
          </div>
          <SearchBar
            keywords={keywords}
            location={location}
            onSearch={search}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Results Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            {data && (
              <h2 className="text-lg font-semibold">
                {data.total_count.toLocaleString()} jobs
                {location && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    in {location}
                  </span>
                )}
              </h2>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filters Sidebar */}
          <aside
            className={`w-full shrink-0 lg:block lg:w-64 ${
              showFilters ? "block" : "hidden"
            }`}
          >
            <FilterPanel
              filters={filterValues}
              onChange={setFilter}
              onClear={clearFilters}
            />
          </aside>

          {/* Job Results */}
          <div className="flex-1">
            <JobList
              jobs={data?.jobs || []}
              isLoading={isLoading}
              error={error}
              page={page}
              totalCount={data?.total_count || 0}
              perPage={params.per_page || 20}
              hasMore={data?.has_more || false}
              onPageChange={setPage}
              onJobClick={setSelectedJob}
            />

            {/* Source info */}
            {data?.sources_searched && data.sources_searched.length > 0 && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Searching: {data.sources_searched.join(", ")}
              </p>
            )}

            {/* Errors from connectors */}
            {data?.errors && Object.keys(data.errors).length > 0 && (
              <div className="mt-4 rounded-md bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400">
                <p className="font-medium">Some sources had errors:</p>
                <ul className="mt-1 list-inside list-disc">
                  {Object.entries(data.errors).map(([source, err]) => (
                    <li key={source}>
                      {source}: {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<JobSearchPageSkeleton />}>
      <JobSearchContent />
    </Suspense>
  );
}

function JobSearchPageSkeleton() {
  return (
    <>
      <div className="border-b border-border bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">
              Job Search
            </h1>
          </div>
          <div className="h-10 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="flex gap-6">
            <div className="hidden h-96 w-64 rounded-lg bg-muted lg:block" />
            <div className="flex-1 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-32 rounded-lg bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
