/**
 * CV List component
 */

"use client";

import { useState, useEffect } from "react";
import { cvApi, type CVListItem } from "@/lib/api/cv";

interface CVListProps {
  refreshTrigger?: number;
}

export function CVList({ refreshTrigger }: CVListProps) {
  const [cvs, setCvs] = useState<CVListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCVs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await cvApi.list();
      setCvs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CVs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCVs();
  }, [refreshTrigger]);

  const handleDelete = async (cvId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      await cvApi.delete(cvId);
      await loadCVs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete CV");
    }
  };

  const handleSetPrimary = async (cvId: string) => {
    try {
      await cvApi.setPrimary(cvId);
      await loadCVs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to set primary CV");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (cvs.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <p className="text-sm text-gray-600">
          No CVs uploaded yet. Upload your first CV above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cvs.map((cv) => (
        <div
          key={cv.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <svg
                className="h-10 w-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-medium text-gray-900">{cv.filename}</p>
                {cv.is_primary && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    Primary
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Uploaded {new Date(cv.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!cv.is_primary && (
              <button
                onClick={() => handleSetPrimary(cv.id)}
                className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                Set Primary
              </button>
            )}
            <button
              onClick={() => handleDelete(cv.id, cv.filename)}
              className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
