/**
 * CV Management page
 */

"use client";

import { CVUpload } from "@/lib/components/cv-upload";
import { CVList } from "@/lib/components/cv-list";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";

export default function CVsPage() {
  return (
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
              <CVUpload />
            </div>
          </CardContent>
        </Card>

        {/* CV List Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your CVs</CardTitle>
          </CardHeader>
          <CardContent>
            <CVList />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
