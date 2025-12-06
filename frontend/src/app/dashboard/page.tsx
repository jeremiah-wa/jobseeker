/**
 * Dashboard page (protected)
 */

'use client';

import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <h1 className="text-xl font-bold text-gray-900">Jobseeker</h1>
                </div>
              </div>
              <div className="flex items-center">
                <span className="mr-4 text-sm text-gray-700">{user?.email}</span>
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
            <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.full_name}!</h2>
            <p className="mt-2 text-gray-600">
              Your account tier: <span className="font-semibold">{user?.tier}</span>
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900">My CVs</h3>
              <p className="mt-2 text-sm text-gray-600">Manage your CV templates</p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900">Saved Jobs</h3>
              <p className="mt-2 text-sm text-gray-600">View your saved job listings</p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900">Tailored CVs</h3>
              <p className="mt-2 text-sm text-gray-600">AI-generated tailored CVs</p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
