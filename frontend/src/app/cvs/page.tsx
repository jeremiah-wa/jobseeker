/**
 * CV Management page (protected)
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/auth-context";
import { ProtectedRoute } from "@/lib/components/protected-route";
import { CVUpload } from "@/lib/components/cv-upload";
import { CVList } from "@/lib/components/cv-list";
import {
  Card,
  CardContent,
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
import { LogOut, Settings, User } from "lucide-react";

export default function CVsPage() {
  const { user, logout } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    // Trigger CV list refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link
                    href="/dashboard"
                    className="text-xl font-bold text-foreground"
                  >
                    Jobseeker
                  </Link>
                </div>
                <div className="ml-6 flex space-x-8">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-muted-foreground hover:border-border hover:text-foreground"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/cvs"
                    className="inline-flex items-center border-b-2 border-primary px-1 pt-1 text-sm font-medium text-foreground"
                  >
                    My CVs
                  </Link>
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
            <h1 className="text-3xl font-bold text-foreground">My CVs</h1>
            <p className="mt-2 text-muted-foreground">
              Upload and manage your CV templates
            </p>
          </div>

          <div className="space-y-8">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upload New CV</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mx-auto max-w-2xl">
                  <CVUpload onUploadSuccess={handleUploadSuccess} />
                </div>
              </CardContent>
            </Card>

            {/* CV List Section */}
            <Card>
              <CardHeader>
                <CardTitle>Your CVs</CardTitle>
              </CardHeader>
              <CardContent>
                <CVList refreshTrigger={refreshTrigger} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
