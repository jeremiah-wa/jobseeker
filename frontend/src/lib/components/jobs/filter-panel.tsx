/**
 * Filter panel for job search
 */

"use client";

import { MapPin, DollarSign, Briefcase, Globe } from "lucide-react";
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
  location: string;
  salaryMin: string;
  salaryMax: string;
  jobType: JobType | "";
  remote: boolean;
}

interface FilterPanelProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  onClear: () => void;
}

export function FilterPanel({ filters, onChange, onClear }: FilterPanelProps) {
  const updateFilter = <K extends keyof FilterValues>(
    key: K,
    value: FilterValues[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.location ||
    filters.salaryMin ||
    filters.salaryMax ||
    filters.jobType ||
    filters.remote;

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

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          Location
        </Label>
        <Input
          id="location"
          placeholder="e.g., London, Remote"
          value={filters.location}
          onChange={(e) => updateFilter("location", e.target.value)}
        />
      </div>

      {/* Salary Range */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4" />
          Salary Range
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.salaryMin}
            onChange={(e) => updateFilter("salaryMin", e.target.value)}
            className="w-full"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.salaryMax}
            onChange={(e) => updateFilter("salaryMax", e.target.value)}
            className="w-full"
          />
        </div>
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
            updateFilter("jobType", value === "any" ? "" : (value as JobType))
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
          onCheckedChange={(checked) => updateFilter("remote", checked)}
        />
      </div>
    </div>
  );
}
