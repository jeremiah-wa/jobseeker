/**
 * CV List component
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cvApi, type CVListItem } from "@/lib/api/cv";
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
import { Skeleton } from "@/lib/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { FileText, Star } from "lucide-react";

interface CVListProps {
  refreshTrigger?: number;
}

export function CVList({ refreshTrigger }: CVListProps) {
  const [cvs, setCvs] = useState<CVListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
    try {
      await cvApi.delete(cvId);
      toast({
        title: "CV deleted",
        description: `"${filename}" has been removed.`,
      });
      await loadCVs();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to delete CV",
        description: err instanceof Error ? err.message : "An error occurred",
      });
    }
  };

  const handleSetPrimary = async (cvId: string, filename: string) => {
    try {
      await cvApi.setPrimary(cvId);
      toast({
        title: "Primary CV updated",
        description: `"${filename}" is now your primary CV.`,
      });
      await loadCVs();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to set primary CV",
        description: err instanceof Error ? err.message : "An error occurred",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (cvs.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
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
          className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm"
        >
          <Link
            href={`/cvs/${cv.id}`}
            className="flex flex-1 items-center space-x-4 hover:opacity-80"
          >
            <div className="flex-shrink-0">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-foreground">
                  {cv.filename}
                </span>
                {cv.is_primary && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary"
                  >
                    Primary
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Uploaded {new Date(cv.created_at).toLocaleDateString()}
              </p>
            </div>
          </Link>

          <div className="flex items-center space-x-2">
            {!cv.is_primary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetPrimary(cv.id, cv.filename);
                }}
                className="border border-primary/20 bg-primary/5 text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Star className="mr-1.5 h-4 w-4" />
                Set Primary
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  Delete
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
                    onClick={() => handleDelete(cv.id, cv.filename)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}
