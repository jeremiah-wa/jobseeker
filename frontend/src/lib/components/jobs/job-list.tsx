/**
 * Job list component with loading and empty states
 */

"use client";

import { JobCard } from "./job-card";
import { Skeleton } from "@/lib/components/ui/skeleton";
import { Button } from "@/lib/components/ui/button";
import { AlertCircle, SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import type { Job } from "@/lib/api/jobs";

interface JobListProps {
  jobs: Job[];
  isLoading: boolean;
  error: Error | null;
  page: number;
  totalCount: number;
  perPage: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onJobClick: (job: Job) => void;
}

function JobCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function JobList({
  jobs,
  isLoading,
  error,
  page,
  totalCount,
  perPage,
  hasMore,
  onPageChange,
  onJobClick,
}: JobListProps) {
  // Loading state
  if (isLoading && jobs.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="mb-2 h-10 w-10 text-destructive" />
        <h3 className="font-medium text-destructive">Error loading jobs</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "Something went wrong. Please try again."}
        </p>
      </div>
    );
  }

  // Empty state
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center">
        <SearchX className="mb-2 h-10 w-10 text-muted-foreground" />
        <h3 className="font-medium">No jobs found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your search or filters to find what you&apos;re looking
          for.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / perPage);
  const startItem = (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, totalCount);

  return (
    <div className="space-y-4">
      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {startItem}-{endItem} of {totalCount.toLocaleString()} jobs
        </span>
        {isLoading && <span className="text-primary">Updating...</span>}
      </div>

      {/* Job cards */}
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard
            key={`${job.source}-${job.id}`}
            job={job}
            onClick={() => onJobClick(job)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="px-4 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasMore || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
