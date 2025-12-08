/**
 * Dashboard page (protected)
 */

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { ProtectedRoute } from "@/lib/components/protected-route";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/lib/components/ui/avatar";
import { ThemeToggle } from "@/lib/components/ui/theme-toggle";
import { Input } from "@/lib/components/ui/input";
import { Button } from "@/lib/components/ui/button";
import { LogOut, Settings, User, Search, MapPin } from "lucide-react";

export default function DashboardPage() {
  const { user, logout } = useAuth();
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
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <h1 className="text-xl font-bold text-foreground">
                    Jobseeker
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                        {user?.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Welcome, {user?.full_name}!
            </h2>
            <p className="mt-2 text-muted-foreground">
              Your account tier:{" "}
              <span className="font-semibold">{user?.tier}</span>
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
      </div>
    </ProtectedRoute>
  );
}
