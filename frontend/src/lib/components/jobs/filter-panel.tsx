/**
 * Filter panel for job search
 */

"use client";

import { DollarSign, Briefcase, Globe } from "lucide-react";
import { Input } from "@/lib/components/ui/input";
import { Label } from "@/lib/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { Switch } from "@/lib/components/ui/switch";
import { Button } from "@/lib/components/ui/button";
import type { JobType } from "@/lib/api/jobs";

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
];

export interface FilterValues {
  salaryMin: string;
  salaryMax: string;
  jobType: JobType | "";
  remote: boolean;
}

interface FilterPanelProps {
  filters: FilterValues;
  onChange: (
    key: keyof FilterValues,
    value: FilterValues[keyof FilterValues]
  ) => void;
  onClear: () => void;
}

export function FilterPanel({ filters, onChange, onClear }: FilterPanelProps) {
  const hasActiveFilters =
    filters.salaryMin || filters.salaryMax || filters.jobType || filters.remote;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Salary Range */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4" />
          Minimum Salary
        </Label>
        <Input
          type="number"
          placeholder="e.g., 50000"
          value={filters.salaryMin}
          onChange={(e) => onChange("salaryMin", e.target.value)}
        />
      </div>

      {/* Job Type */}
      <div className="space-y-2">
        <Label htmlFor="jobType" className="flex items-center gap-2 text-sm">
          <Briefcase className="h-4 w-4" />
          Job Type
        </Label>
        <Select
          value={filters.jobType || "any"}
          onValueChange={(value) =>
            onChange("jobType", value === "any" ? "" : (value as JobType))
          }
        >
          <SelectTrigger id="jobType">
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any type</SelectItem>
            {JOB_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Remote Toggle */}
      <div className="flex items-center justify-between">
        <Label
          htmlFor="remote"
          className="flex cursor-pointer items-center gap-2 text-sm"
        >
          <Globe className="h-4 w-4" />
          Remote only
        </Label>
        <Switch
          id="remote"
          checked={filters.remote}
          onCheckedChange={(checked) => onChange("remote", checked)}
        />
      </div>
    </div>
  );
}
