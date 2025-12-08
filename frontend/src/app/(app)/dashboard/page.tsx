/**
 * Dashboard page
 */

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import { Input } from "@/lib/components/ui/input";
import { Button } from "@/lib/components/ui/button";
import { Search, MapPin } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("Melbourne, Australia");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keywords) params.set("q", keywords);
    if (location) params.set("location", location);
    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">
          Welcome, {user?.full_name}!
        </h2>
        <p className="mt-2 text-muted-foreground">
          Your account tier: <span className="font-semibold">{user?.tier}</span>
        </p>
      </div>

      {/* Job Search Panel */}
      <Card className="mb-8 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Your Next Job
          </CardTitle>
          <CardDescription>
            Search thousands of jobs across multiple platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch}>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Job title, keywords, or company"
                  className="rounded-b-none pl-10 sm:rounded-l-md sm:rounded-r-none sm:border-r-0"
                />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, state, or country"
                  className="rounded-none pl-10 sm:border-r-0"
                />
              </div>
              <Button
                type="submit"
                className="rounded-t-none sm:rounded-l-none sm:rounded-r-md sm:px-8"
              >
                <Search className="mr-2 h-4 w-4" />
                Search Jobs
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/cvs" className="group">
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle>My CVs</CardTitle>
              <CardDescription>
                Upload and manage your CV templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-sm font-medium text-primary group-hover:underline">
                Manage CVs →
              </span>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Saved Jobs</CardTitle>
            <CardDescription>View your saved job listings</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tailored CVs</CardTitle>
            <CardDescription>AI-generated tailored CVs</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}
