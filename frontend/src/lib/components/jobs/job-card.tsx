/**
 * Job card component for displaying job listings
 */

"use client";

import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/lib/components/ui/card";
import { Badge } from "@/lib/components/ui/badge";
import { Button } from "@/lib/components/ui/button";
import type { Job } from "@/lib/api/jobs";

interface JobCardProps {
  job: Job;
  onClick?: () => void;
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

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function formatJobType(jobType: string | null): string | null {
  if (!jobType) return null;
  return jobType
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");
}

export function JobCard({ job, onClick }: JobCardProps) {
  const salary = formatSalary(
    job.salary_min,
    job.salary_max,
    job.salary_currency
  );
  const postedDate = formatDate(job.posted_at);
  const jobType = formatJobType(job.job_type);

  return (
    <Card
      className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Title */}
            <h3 className="line-clamp-1 font-semibold text-foreground">
              {job.title}
            </h3>

            {/* Company and Location */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap items-center gap-2">
              {jobType && (
                <Badge variant="secondary" className="text-xs">
                  {jobType}
                </Badge>
              )}
              {salary && (
                <Badge variant="outline" className="text-xs">
                  <DollarSign className="mr-1 h-3 w-3" />
                  {salary}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs capitalize">
                {job.source}
              </Badge>
            </div>

            {/* Posted Date */}
            {postedDate && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Posted {postedDate}
              </p>
            )}
          </div>

          {/* External Link Button */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              window.open(job.url, "_blank", "noopener,noreferrer");
            }}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
