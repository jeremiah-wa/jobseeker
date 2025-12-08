/**
 * CV Upload component with drag-and-drop
 */

"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { cvApi } from "@/lib/api/cv";
import { env } from "@/lib/env";
import { Upload } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";

interface CVUploadProps {
  onUploadSuccess?: () => void;
}

export function CVUpload({ onUploadSuccess }: CVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== "application/pdf") {
      return "Only PDF files are allowed";
    }

    // Check file size
    const maxSize = env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size must be less than ${env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB}MB`;
    }

    return null;
  };

  const handleUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: validationError,
      });
      return;
    }

    setIsUploading(true);

    try {
      const response = await cvApi.upload(file);
      toast({
        title: "CV uploaded",
        description: `"${response.filename}" uploaded successfully!`,
      });
      onUploadSuccess?.();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Failed to upload CV",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        className="sr-only"
        disabled={isUploading}
      />
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted hover:border-muted-foreground hover:bg-muted/80"
        } ${isUploading ? "pointer-events-none opacity-50" : ""} `}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-8 w-8 text-primary" />
          </div>

          <div className="text-sm text-muted-foreground">
            {isUploading ? (
              <p className="font-medium text-foreground">Uploading...</p>
            ) : (
              <>
                <p>
                  <span className="font-semibold text-primary hover:text-primary/80">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            PDF files only, up to {env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB}MB
          </p>
        </div>
      </div>
    </div>
  );
}
