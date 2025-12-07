"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CV, cvApi } from "@/lib/api/cv";

export default function CVDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cvId = params.id as string;

  const [cv, setCv] = useState<CV | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingPrimary, setIsSettingPrimary] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const loadPreview = useCallback(async () => {
    if (!cvId) return;

    try {
      setIsLoadingPreview(true);
      const url = await cvApi.getPreviewUrl(cvId);
      setPdfUrl(url);
    } catch (err) {
      console.error("Failed to load preview:", err);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [cvId]);

  useEffect(() => {
    const fetchCV = async () => {
      try {
        setIsLoading(true);
        const data = await cvApi.get(cvId);
        setCv(data);
        // Load preview after CV data is fetched
        loadPreview();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load CV");
      } finally {
        setIsLoading(false);
      }
    };

    if (cvId) {
      fetchCV();
    }
  }, [cvId, loadPreview]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleDelete = async () => {
    if (!cv || !confirm("Are you sure you want to delete this CV?")) return;

    try {
      setIsDeleting(true);
      await cvApi.delete(cv.id);
      router.push("/cvs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete CV");
      setIsDeleting(false);
    }
  };

  const handleSetPrimary = async () => {
    if (!cv) return;

    try {
      setIsSettingPrimary(true);
      const updated = await cvApi.setPrimary(cv.id);
      setCv(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set as primary");
    } finally {
      setIsSettingPrimary(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = async () => {
    if (!cv) return;

    try {
      setIsDownloading(true);
      await cvApi.download(cv.id, cv.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download CV");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading CV...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Error Loading CV
          </h2>
          <p className="mt-1 text-gray-600">{error}</p>
          <Link
            href="/cvs"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            ← Back to CVs
          </Link>
        </div>
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">CV Not Found</h2>
          <Link
            href="/cvs"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            ← Back to CVs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/cvs"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg
              className="mr-1 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to CVs
          </Link>
        </div>

        {/* CV Details Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          {/* Title Section */}
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {cv.filename}
                  </h1>
                  {cv.is_primary && (
                    <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Primary CV
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="px-6 py-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Uploaded</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(cv.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Last Updated
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(cv.updated_at)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {cv.is_primary ? "Primary CV" : "Secondary CV"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Parsed Data
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {cv.parsed_data ? "Available" : "Not yet parsed"}
                </dd>
              </div>
            </dl>

            {/* PDF Preview */}
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-medium text-gray-500">
                Document Preview
              </h3>
              {isLoadingPreview ? (
                <div className="flex h-96 items-center justify-center rounded-md border border-gray-200 bg-gray-50">
                  <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">
                      Loading preview...
                    </p>
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0`}
                  className="h-[600px] w-full rounded-md border border-gray-200"
                  title="CV Preview"
                />
              ) : (
                <div className="flex h-96 items-center justify-center rounded-md border border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-500">Preview not available</p>
                </div>
              )}
            </div>

            {/* Raw Text Preview */}
            {cv.raw_text && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500">
                  Extracted Text Preview
                </h3>
                <div className="mt-2 max-h-48 overflow-y-auto rounded-md bg-gray-50 p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {cv.raw_text.slice(0, 1000)}
                    {cv.raw_text.length > 1000 && "..."}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>

              {!cv.is_primary && (
                <button
                  onClick={handleSetPrimary}
                  disabled={isSettingPrimary}
                  className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSettingPrimary ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Setting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Set as Primary
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete CV
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
