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
import { ProtectedRoute } from "@/lib/components/protected-route";
import type { Job } from "@/lib/api/jobs";
import { Briefcase, SlidersHorizontal } from "lucide-react";
import { Button } from "@/lib/components/ui/button";

function JobSearchContent() {
  const {
    params,
    query,
    filterValues,
    page,
    setQuery,
    setFilters,
    clearFilters,
    setPage,
  } = useJobSearchParams();

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const { data, isLoading, error } = useJobSearch(params);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Job Search</h1>
              <p className="text-sm text-muted-foreground">
                Find your next opportunity
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar value={query} onChange={setQuery} />
        </div>

        {/* Mobile Filter Toggle */}
        <div className="mb-4 lg:hidden">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filters Sidebar */}
          <aside
            className={`w-full shrink-0 lg:w-72 ${
              showFilters ? "block" : "hidden lg:block"
            }`}
          >
            <FilterPanel
              filters={filterValues}
              onChange={setFilters}
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
    </div>
  );
}

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<JobSearchPageSkeleton />}>
        <JobSearchContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function JobSearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Job Search</h1>
              <p className="text-sm text-muted-foreground">
                Find your next opportunity
              </p>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 rounded-md bg-muted" />
          <div className="flex gap-6">
            <div className="hidden h-96 w-72 rounded-lg bg-muted lg:block" />
            <div className="flex-1 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-32 rounded-lg bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
