/**
 * CV API client
 */

import { apiClient } from "./client";

export type ParsingStatus = "pending" | "processing" | "completed" | "failed";

export interface Experience {
  title: string;
  company: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string;
  highlights: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location: string | null;
  graduation_date: string | null;
  gpa: string | null;
}

export interface ParsedCV {
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: string[];
  experience: Experience[];
  education: Education[];
  certifications: string[];
  languages: string[];
}

export interface CV {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  raw_text: string | null;
  parsed_data: ParsedCV | null;
  parsing_status: ParsingStatus;
  parsing_error: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface CVListItem {
  id: string;
  filename: string;
  is_primary: boolean;
  parsing_status: ParsingStatus;
  created_at: string;
  updated_at: string;
}

export interface CVUploadResponse {
  id: string;
  filename: string;
  file_path: string;
  message: string;
}

export interface CVParseResponse {
  id: string;
  parsing_status: ParsingStatus;
  parsing_error: string | null;
  parsed_data: ParsedCV | null;
  message: string;
}

export const cvApi = {
  /**
   * Upload a new CV
   */
  async upload(file: File): Promise<CVUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<CVUploadResponse>(
      "/cv/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },

  /**
   * List all CVs for the current user
   */
  async list(): Promise<CVListItem[]> {
    const response = await apiClient.get<CVListItem[]>("/cv/");
    return response.data;
  },

  /**
   * Get CV details by ID
   */
  async get(cvId: string): Promise<CV> {
    const response = await apiClient.get<CV>(`/cv/${cvId}`);
    return response.data;
  },

  /**
   * Delete a CV
   */
  async delete(cvId: string): Promise<void> {
    await apiClient.delete(`/cv/${cvId}`);
  },

  /**
   * Set a CV as primary
   */
  async setPrimary(cvId: string): Promise<CV> {
    const response = await apiClient.patch<CV>(`/cv/${cvId}/primary`);
    return response.data;
  },

  /**
   * Download a CV file
   */
  async download(cvId: string, filename: string): Promise<void> {
    const response = await apiClient.get(`/cv/${cvId}/download`, {
      responseType: "blob",
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Get a blob URL for PDF preview
   */
  async getPreviewUrl(cvId: string): Promise<string> {
    const response = await apiClient.get(`/cv/${cvId}/download`, {
      responseType: "blob",
    });

    return window.URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" })
    );
  },

  /**
   * Trigger CV parsing (PDF text extraction + LLM structuring)
   */
  async parse(cvId: string): Promise<CVParseResponse> {
    const response = await apiClient.post<CVParseResponse>(`/cv/${cvId}/parse`);
    return response.data;
  },

  /**
   * Manually update parsed CV data
   */
  async updateParsedData(cvId: string, data: Partial<ParsedCV>): Promise<CV> {
    const response = await apiClient.patch<CV>(`/cv/${cvId}/parsed-data`, data);
    return response.data;
  },
};
