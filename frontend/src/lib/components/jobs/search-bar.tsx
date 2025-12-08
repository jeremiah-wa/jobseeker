/**
 * Job search bar with keyword and location inputs
 */

"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/lib/components/ui/input";
import { Button } from "@/lib/components/ui/button";

interface SearchBarProps {
  keywords: string;
  location: string;
  onSearch: (keywords: string, location: string) => void;
}

export function SearchBar({ keywords, location, onSearch }: SearchBarProps) {
  const [localKeywords, setLocalKeywords] = useState(keywords);
  const [localLocation, setLocalLocation] = useState(location);

  // Sync local values when external values change
  useEffect(() => {
    setLocalKeywords(keywords);
  }, [keywords]);

  useEffect(() => {
    setLocalLocation(location);
  }, [location]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(localKeywords, localLocation);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-0">
        {/* Keywords input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={localKeywords}
            onChange={(e) => setLocalKeywords(e.target.value)}
            placeholder="Job title, keywords, or company"
            className="rounded-b-none pl-10 sm:rounded-l-md sm:rounded-r-none sm:border-r-0"
          />
        </div>

        {/* Location input */}
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={localLocation}
            onChange={(e) => setLocalLocation(e.target.value)}
            placeholder="City, state, or country"
            className="rounded-none pl-10 sm:border-r-0"
          />
        </div>

        {/* Search button */}
        <Button
          type="submit"
          className="rounded-t-none sm:rounded-l-none sm:rounded-r-md sm:px-8"
        >
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>
    </form>
  );
}
