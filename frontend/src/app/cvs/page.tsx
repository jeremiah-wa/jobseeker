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

export default function CVsPage() {
  const { user, logout } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    // Trigger CV list refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link
                    href="/dashboard"
                    className="text-xl font-bold text-gray-900"
                  >
                    Jobseeker
                  </Link>
                </div>
                <div className="ml-6 flex space-x-8">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/cvs"
                    className="inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-sm font-medium text-gray-900"
                  >
                    My CVs
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <span className="mr-4 text-sm text-gray-700">
                  {user?.email}
                </span>
                <button
                  onClick={logout}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My CVs</h1>
            <p className="mt-2 text-gray-600">
              Upload and manage your CV templates
            </p>
          </div>

          <div className="space-y-8">
            {/* Upload Section */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Upload New CV
              </h2>
              <div className="mx-auto max-w-2xl">
                <CVUpload onUploadSuccess={handleUploadSuccess} />
              </div>
            </div>

            {/* CV List Section */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Your CVs
              </h2>
              <CVList refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
