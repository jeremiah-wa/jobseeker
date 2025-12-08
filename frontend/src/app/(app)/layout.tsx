/**
 * Layout for authenticated app pages (dashboard, jobs, etc.)
 */

"use client";

import { ProtectedRoute } from "@/lib/components/protected-route";
import { Navbar } from "@/lib/components/navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        {children}
      </div>
    </ProtectedRoute>
  );
}
