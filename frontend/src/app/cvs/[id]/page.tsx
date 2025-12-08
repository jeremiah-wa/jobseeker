"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ParsingStatus } from "@/lib/api/cv";
import {
  useCV,
  useCVPreview,
  useDeleteCV,
  useSetPrimaryCV,
  useParseCV,
  useUpdateParsedData,
  useDownloadCV,
} from "@/lib/hooks/use-cv";
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
import {
  Trash2,
  Download,
  Star,
  ArrowLeft,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/lib/components/ui/dialog";
import { Input } from "@/lib/components/ui/input";
import { Label } from "@/lib/components/ui/label";
import { Textarea } from "@/lib/components/ui/textarea";

const getParsingStatusBadge = (status: ParsingStatus) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Processing
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Parsed
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <XCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      );
  }
};

export default function CVDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cvId = params.id as string;

  // TanStack Query hooks for data fetching
  const { data: cv, isLoading, error } = useCV(cvId);
  const { data: pdfUrl, isLoading: isLoadingPreview } = useCVPreview(cvId);

  // Mutation hooks
  const deleteCV = useDeleteCV({
    onSuccess: () => router.push("/cvs"),
  });
  const setPrimaryCV = useSetPrimaryCV();
  const parseCV = useParseCV();
  const updateParsedData = useUpdateParsedData({
    onSuccess: () => setIsEditDialogOpen(false),
  });
  const downloadCV = useDownloadCV();

  // Edit parsed data state (local UI state)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTab, setEditTab] = useState("contact");
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    skills: [] as string[],
    experience: [] as Array<{
      title: string;
      company: string;
      location: string;
      start_date: string;
      end_date: string;
      description: string;
    }>,
    education: [] as Array<{
      degree: string;
      institution: string;
      location: string;
      graduation_date: string;
      gpa: string;
    }>,
    certifications: [] as string[],
    languages: [] as string[],
  });
  const [newSkill, setNewSkill] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  // Derived loading states from mutations
  const isDeleting = deleteCV.isPending;
  const isSettingPrimary = setPrimaryCV.isPending;
  const isParsing = parseCV.isPending;
  const isDownloading = downloadCV.isPending;
  const isSavingEdit = updateParsedData.isPending;

  const handleDelete = () => {
    if (!cv) return;
    deleteCV.mutate(cv.id);
  };

  const handleSetPrimary = () => {
    if (!cv) return;
    setPrimaryCV.mutate(cv.id);
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

  const handleDownload = () => {
    if (!cv) return;
    downloadCV.mutate({ cvId: cv.id, filename: cv.filename });
  };

  const handleParse = () => {
    if (!cv) return;
    parseCV.mutate(cv.id);
  };

  const openEditDialog = () => {
    if (!cv) return;
    // Initialize form with existing data
    setEditForm({
      full_name: cv.parsed_data?.full_name || "",
      email: cv.parsed_data?.email || "",
      phone: cv.parsed_data?.phone || "",
      location: cv.parsed_data?.location || "",
      summary: cv.parsed_data?.summary || "",
      skills: cv.parsed_data?.skills || [],
      experience: (cv.parsed_data?.experience || []).map((exp) => ({
        title: exp.title || "",
        company: exp.company || "",
        location: exp.location || "",
        start_date: exp.start_date || "",
        end_date: exp.end_date || "",
        description: exp.description || "",
      })),
      education: (cv.parsed_data?.education || []).map((edu) => ({
        degree: edu.degree || "",
        institution: edu.institution || "",
        location: edu.location || "",
        graduation_date: edu.graduation_date || "",
        gpa: edu.gpa || "",
      })),
      certifications: cv.parsed_data?.certifications || [],
      languages: cv.parsed_data?.languages || [],
    });
    setEditTab("contact");
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!cv) return;
    updateParsedData.mutate({
      cvId: cv.id,
      data: {
        full_name: editForm.full_name,
        email: editForm.email || null,
        phone: editForm.phone || null,
        location: editForm.location || null,
        summary: editForm.summary || null,
        skills: editForm.skills,
        experience: editForm.experience.map((exp) => ({
          title: exp.title,
          company: exp.company,
          location: exp.location || null,
          start_date: exp.start_date || null,
          end_date: exp.end_date || null,
          description: exp.description,
          highlights: [],
        })),
        education: editForm.education.map((edu) => ({
          degree: edu.degree,
          institution: edu.institution,
          location: edu.location || null,
          graduation_date: edu.graduation_date || null,
          gpa: edu.gpa || null,
        })),
        certifications: editForm.certifications,
        languages: editForm.languages,
      },
    });
  };

  // Helper functions for array editing
  const addSkill = () => {
    if (newSkill.trim()) {
      setEditForm({
        ...editForm,
        skills: [...editForm.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter((_, i) => i !== index),
    });
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setEditForm({
        ...editForm,
        certifications: [...editForm.certifications, newCertification.trim()],
      });
      setNewCertification("");
    }
  };

  const removeCertification = (index: number) => {
    setEditForm({
      ...editForm,
      certifications: editForm.certifications.filter((_, i) => i !== index),
    });
  };

  const addLanguage = () => {
    if (newLanguage.trim()) {
      setEditForm({
        ...editForm,
        languages: [...editForm.languages, newLanguage.trim()],
      });
      setNewLanguage("");
    }
  };

  const removeLanguage = (index: number) => {
    setEditForm({
      ...editForm,
      languages: editForm.languages.filter((_, i) => i !== index),
    });
  };

  const addExperience = () => {
    setEditForm({
      ...editForm,
      experience: [
        ...editForm.experience,
        {
          title: "",
          company: "",
          location: "",
          start_date: "",
          end_date: "",
          description: "",
        },
      ],
    });
  };

  const updateExperience = (
    index: number,
    field: keyof (typeof editForm.experience)[0],
    value: string
  ) => {
    const updated = [...editForm.experience];
    updated[index] = { ...updated[index], [field]: value };
    setEditForm({ ...editForm, experience: updated });
  };

  const removeExperience = (index: number) => {
    setEditForm({
      ...editForm,
      experience: editForm.experience.filter((_, i) => i !== index),
    });
  };

  const addEducation = () => {
    setEditForm({
      ...editForm,
      education: [
        ...editForm.education,
        {
          degree: "",
          institution: "",
          location: "",
          graduation_date: "",
          gpa: "",
        },
      ],
    });
  };

  const updateEducation = (
    index: number,
    field: keyof (typeof editForm.education)[0],
    value: string
  ) => {
    const updated = [...editForm.education];
    updated[index] = { ...updated[index], [field]: value };
    setEditForm({ ...editForm, education: updated });
  };

  const removeEducation = (index: number) => {
    setEditForm({
      ...editForm,
      education: editForm.education.filter((_, i) => i !== index),
    });
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
          <p className="mt-1 text-muted-foreground">{error?.message}</p>
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
                  <div className="mt-1 flex flex-wrap gap-2">
                    {cv.is_primary && (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary"
                      >
                        Primary CV
                      </Badge>
                    )}
                    {getParsingStatusBadge(cv.parsing_status)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Content */}
          <div className="px-6 py-5">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="parsed" disabled={!cv.parsed_data}>
                  Parsed Data
                </TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="text" disabled={!cv.raw_text}>
                  Raw Text
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
                      CV Type
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {cv.is_primary ? "Primary CV" : "Secondary CV"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Parsing Status
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {cv.parsing_status === "completed"
                        ? "Parsed successfully"
                        : cv.parsing_status === "failed"
                          ? cv.parsing_error || "Parsing failed"
                          : cv.parsing_status === "processing"
                            ? "Currently parsing..."
                            : "Not yet parsed"}
                    </dd>
                  </div>
                </dl>
              </TabsContent>

              <TabsContent value="parsed" className="mt-6">
                {/* Show edit form when parsing failed or no parsed data */}
                {(cv.parsing_status === "failed" || !cv.parsed_data) && (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <XCircle className="mx-auto h-12 w-12 text-destructive" />
                    <h3 className="mt-4 text-lg font-semibold">
                      {cv.parsing_status === "failed"
                        ? "Parsing Failed"
                        : "No Parsed Data"}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {cv.parsing_error ||
                        "You can manually enter your CV information below."}
                    </p>
                    <Button onClick={openEditDialog} className="mt-4">
                      <Pencil className="mr-2 h-4 w-4" />
                      Enter Information Manually
                    </Button>
                  </div>
                )}

                {cv.parsed_data && (
                  <div className="space-y-6">
                    {/* Contact Info */}
                    <div className="rounded-lg border border-border p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">
                          {cv.parsed_data.full_name}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={openEditDialog}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {cv.parsed_data.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {cv.parsed_data.email}
                          </span>
                        )}
                        {cv.parsed_data.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {cv.parsed_data.phone}
                          </span>
                        )}
                        {cv.parsed_data.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {cv.parsed_data.location}
                          </span>
                        )}
                      </div>
                      {cv.parsed_data.summary && (
                        <p className="mt-3 text-sm text-foreground">
                          {cv.parsed_data.summary}
                        </p>
                      )}
                    </div>

                    {/* Skills */}
                    {cv.parsed_data.skills.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 font-medium text-foreground">
                          <Sparkles className="h-4 w-4" />
                          Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {cv.parsed_data.skills.map((skill, i) => (
                            <Badge key={i} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {cv.parsed_data.experience.length > 0 && (
                      <div>
                        <h4 className="mb-3 flex items-center gap-2 font-medium text-foreground">
                          <Briefcase className="h-4 w-4" />
                          Experience
                        </h4>
                        <div className="space-y-4">
                          {cv.parsed_data.experience.map((exp, i) => (
                            <div
                              key={i}
                              className="rounded-lg border border-border p-3"
                            >
                              <div className="font-medium text-foreground">
                                {exp.title}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {exp.company}
                                {exp.location && ` • ${exp.location}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {exp.start_date}
                                {exp.end_date && ` – ${exp.end_date}`}
                              </div>
                              {exp.description && (
                                <p className="mt-2 text-sm text-foreground">
                                  {exp.description}
                                </p>
                              )}
                              {exp.highlights.length > 0 && (
                                <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                                  {exp.highlights.map((h, j) => (
                                    <li key={j}>{h}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {cv.parsed_data.education.length > 0 && (
                      <div>
                        <h4 className="mb-3 flex items-center gap-2 font-medium text-foreground">
                          <GraduationCap className="h-4 w-4" />
                          Education
                        </h4>
                        <div className="space-y-3">
                          {cv.parsed_data.education.map((edu, i) => (
                            <div
                              key={i}
                              className="rounded-lg border border-border p-3"
                            >
                              <div className="font-medium text-foreground">
                                {edu.degree}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {edu.institution}
                                {edu.location && ` • ${edu.location}`}
                              </div>
                              {edu.graduation_date && (
                                <div className="text-xs text-muted-foreground">
                                  {edu.graduation_date}
                                  {edu.gpa && ` • GPA: ${edu.gpa}`}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {cv.parsed_data.certifications.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 font-medium text-foreground">
                          <Award className="h-4 w-4" />
                          Certifications
                        </h4>
                        <ul className="list-inside list-disc text-sm text-foreground">
                          {cv.parsed_data.certifications.map((cert, i) => (
                            <li key={i}>{cert}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Languages */}
                    {cv.parsed_data.languages.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 font-medium text-foreground">
                          <Languages className="h-4 w-4" />
                          Languages
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {cv.parsed_data.languages.map((lang, i) => (
                            <Badge key={i} variant="outline">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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

              <Button
                onClick={handleParse}
                disabled={isParsing || cv.parsing_status === "processing"}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
              >
                {isParsing || cv.parsing_status === "processing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {cv.parsing_status === "completed"
                      ? "Re-parse CV"
                      : cv.parsing_status === "failed"
                        ? "Retry Parse"
                        : "Parse CV"}
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

      {/* Edit Parsed Data Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="flex h-[85vh] max-h-[700px] flex-col overflow-hidden sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit CV Information</DialogTitle>
            <DialogDescription>
              Update or correct the parsed CV information.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={editTab}
            onValueChange={setEditTab}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>

            {/* Contact Tab */}
            <TabsContent
              value="contact"
              className="mt-4 flex-1 space-y-4 overflow-y-auto pr-2"
            >
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, full_name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    placeholder="john@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm({ ...editForm, location: e.target.value })
                  }
                  placeholder="City, Country"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  value={editForm.summary}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditForm({ ...editForm, summary: e.target.value })
                  }
                  placeholder="Brief professional summary..."
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent
              value="skills"
              className="mt-4 flex-1 space-y-4 overflow-y-auto pr-2"
            >
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSkill())
                  }
                />
                <Button type="button" onClick={addSkill} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editForm.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {skill}
                    <button
                      onClick={() => removeSkill(i)}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {editForm.skills.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No skills added yet.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent
              value="experience"
              className="mt-4 flex-1 space-y-4 overflow-y-auto pr-2"
            >
              {editForm.experience.map((exp, i) => (
                <div key={i} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Experience {i + 1}</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExperience(i)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1">
                      <Label className="text-xs">Job Title</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) =>
                          updateExperience(i, "title", e.target.value)
                        }
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) =>
                          updateExperience(i, "company", e.target.value)
                        }
                        placeholder="Company Name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="grid gap-1">
                      <Label className="text-xs">Location</Label>
                      <Input
                        value={exp.location}
                        onChange={(e) =>
                          updateExperience(i, "location", e.target.value)
                        }
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        value={exp.start_date}
                        onChange={(e) =>
                          updateExperience(i, "start_date", e.target.value)
                        }
                        placeholder="Jan 2020"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">End Date</Label>
                      <Input
                        value={exp.end_date}
                        onChange={(e) =>
                          updateExperience(i, "end_date", e.target.value)
                        }
                        placeholder="Present"
                      />
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={exp.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateExperience(i, "description", e.target.value)
                      }
                      placeholder="Job responsibilities and achievements..."
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addExperience}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Experience
              </Button>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent
              value="education"
              className="mt-4 flex-1 space-y-4 overflow-y-auto pr-2"
            >
              {editForm.education.map((edu, i) => (
                <div key={i} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Education {i + 1}</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEducation(i)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1">
                      <Label className="text-xs">Degree</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) =>
                          updateEducation(i, "degree", e.target.value)
                        }
                        placeholder="Bachelor of Science"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) =>
                          updateEducation(i, "institution", e.target.value)
                        }
                        placeholder="University Name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="grid gap-1">
                      <Label className="text-xs">Location</Label>
                      <Input
                        value={edu.location}
                        onChange={(e) =>
                          updateEducation(i, "location", e.target.value)
                        }
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Graduation Date</Label>
                      <Input
                        value={edu.graduation_date}
                        onChange={(e) =>
                          updateEducation(i, "graduation_date", e.target.value)
                        }
                        placeholder="May 2020"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">GPA</Label>
                      <Input
                        value={edu.gpa}
                        onChange={(e) =>
                          updateEducation(i, "gpa", e.target.value)
                        }
                        placeholder="3.8"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addEducation}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Education
              </Button>
            </TabsContent>

            {/* Other Tab (Certifications & Languages) */}
            <TabsContent
              value="other"
              className="mt-4 flex-1 space-y-6 overflow-y-auto pr-2"
            >
              <div className="space-y-3">
                <Label>Certifications</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    placeholder="Add a certification..."
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addCertification())
                    }
                  />
                  <Button type="button" onClick={addCertification} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.certifications.map((cert, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      {cert}
                      <button
                        onClick={() => removeCertification(i)}
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {editForm.certifications.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No certifications added yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Languages</Label>
                <div className="flex gap-2">
                  <Input
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Add a language..."
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addLanguage())
                    }
                  />
                  <Button type="button" onClick={addLanguage} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.languages.map((lang, i) => (
                    <Badge key={i} variant="outline" className="gap-1 pr-1">
                      {lang}
                      <button
                        onClick={() => removeLanguage(i)}
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {editForm.languages.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No languages added yet.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
