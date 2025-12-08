/**
 * Job detail modal component
 */

"use client";

import {
  MapPin,
  Clock,
  DollarSign,
  ExternalLink,
  Briefcase,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/lib/components/ui/dialog";
import { Badge } from "@/lib/components/ui/badge";
import { Button } from "@/lib/components/ui/button";
import { Skeleton } from "@/lib/components/ui/skeleton";
import { useJob } from "@/lib/hooks/use-jobs";
import type { Job } from "@/lib/api/jobs";

interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null
): string | null {
  if (!min && !max) return null;

  const curr = currency || "USD";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: curr,
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }
  if (min) {
    return `From ${formatter.format(min)}`;
  }
  if (max) {
    return `Up to ${formatter.format(max)}`;
  }
  return null;
}

function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatJobType(jobType: string | null): string | null {
  if (!jobType) return null;
  return jobType
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");
}

export function JobDetailModal({ job, isOpen, onClose }: JobDetailModalProps) {
  // Optionally fetch fresh details (useful if we want more data from the detail endpoint)
  const { data: jobDetails, isLoading } = useJob(
    job?.source || "",
    job?.id || "",
    {
      enabled: isOpen && !!job,
    }
  );

  const displayJob = jobDetails || job;

  if (!displayJob) return null;

  const salary = formatSalary(
    displayJob.salary_min,
    displayJob.salary_max,
    displayJob.salary_currency
  );
  const postedDate = formatDate(displayJob.posted_at);
  const expiresDate = formatDate(displayJob.expires_at);
  const jobType = formatJobType(displayJob.job_type);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <DialogTitle className="text-xl">{displayJob.title}</DialogTitle>
              <p className="mt-1 text-muted-foreground">{displayJob.company}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meta Information */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {displayJob.location}
            </div>
            {jobType && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                {jobType}
              </div>
            )}
            {salary && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                {salary}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">
              Source: {displayJob.source}
            </Badge>
            {postedDate && (
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                Posted {postedDate}
              </Badge>
            )}
            {expiresDate && (
              <Badge variant="secondary">Expires {expiresDate}</Badge>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: displayJob.description }}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-border pt-4">
            <Button asChild className="flex-1">
              <a
                href={displayJob.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Apply on {displayJob.source}
              </a>
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
