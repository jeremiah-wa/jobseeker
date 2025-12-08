"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CV, cvApi } from "@/lib/api/cv";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/lib/components/ui/alert-dialog";
import { Button } from "@/lib/components/ui/button";
import { Badge } from "@/lib/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/lib/components/ui/tabs";
import { Skeleton } from "@/lib/components/ui/skeleton";
import { Trash2, Download, Star, ArrowLeft } from "lucide-react";

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
    if (!cv) return;

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
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading CV...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-6 w-6 text-destructive"
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
          <h2 className="text-lg font-semibold text-foreground">
            Error Loading CV
          </h2>
          <p className="mt-1 text-muted-foreground">{error}</p>
          <Link
            href="/cvs"
            className="mt-4 inline-block text-primary hover:text-primary/80"
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
          <h2 className="text-lg font-semibold text-foreground">
            CV Not Found
          </h2>
          <Link
            href="/cvs"
            className="mt-4 inline-block text-primary hover:text-primary/80"
          >
            ← Back to CVs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/cvs"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to CVs
          </Link>
        </div>

        {/* CV Details Card */}
        <div className="overflow-hidden rounded-lg bg-card shadow">
          {/* Title Section */}
          <div className="border-b border-border px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                  <svg
                    className="h-6 w-6 text-destructive"
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
                  <h1 className="text-xl font-semibold text-foreground">
                    {cv.filename}
                  </h1>
                  {cv.is_primary && (
                    <Badge
                      variant="secondary"
                      className="mt-1 bg-primary/10 text-primary"
                    >
                      Primary CV
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Content */}
          <div className="px-6 py-5">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="text" disabled={!cv.raw_text}>
                  Extracted Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Uploaded
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {formatDate(cv.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {formatDate(cv.updated_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Status
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {cv.is_primary ? "Primary CV" : "Secondary CV"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Parsed Data
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {cv.parsed_data ? "Available" : "Not yet parsed"}
                    </dd>
                  </div>
                </dl>
              </TabsContent>

              <TabsContent value="preview" className="mt-6">
                {isLoadingPreview ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[600px] w-full rounded-md" />
                  </div>
                ) : pdfUrl ? (
                  <iframe
                    src={`${pdfUrl}#toolbar=0&navpanes=0`}
                    className="h-[600px] w-full rounded-md border border-border"
                    title="CV Preview"
                  />
                ) : (
                  <div className="flex h-96 items-center justify-center rounded-md border border-border bg-muted">
                    <p className="text-sm text-muted-foreground">
                      Preview not available
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="text" className="mt-6">
                {cv.raw_text && (
                  <div className="max-h-[600px] overflow-y-auto rounded-md bg-muted p-4">
                    <pre className="whitespace-pre-wrap text-sm text-foreground">
                      {cv.raw_text}
                    </pre>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Actions Section */}
          <div className="border-t border-border bg-muted px-6 py-4">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>

              {!cv.is_primary && (
                <Button
                  onClick={handleSetPrimary}
                  disabled={isSettingPrimary}
                  className="border border-primary/20 bg-primary/5 text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {isSettingPrimary ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Setting...
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4" />
                      Set as Primary
                    </>
                  )}
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    disabled={isDeleting}
                    className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    {isDeleting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete CV
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete CV</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{cv.filename}&quot;?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
