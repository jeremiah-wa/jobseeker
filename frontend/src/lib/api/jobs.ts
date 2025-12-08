/**
 * Jobs API client
 */

import { apiClient } from "./client";

export type JobType =
  | "full-time"
  | "part-time"
  | "contract"
  | "temporary"
  | "internship";

export interface Job {
  id: string;
  source: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  job_type: JobType | null;
  posted_at: string | null;
  expires_at: string | null;
}

export interface JobSearchParams {
  q?: string;
  location?: string;
  radius?: number;
  salary_min?: number;
  salary_max?: number;
  job_type?: JobType;
  remote?: boolean;
  sources?: string;
  page?: number;
  per_page?: number;
}

export interface AggregatedSearchResult {
  jobs: Job[];
  total_count: number;
  page: number;
  per_page: number;
  has_more: boolean;
  sources_searched: string[];
  errors: Record<string, string>;
}

export interface ConnectorInfo {
  name: string;
  display_name: string;
  is_available: boolean;
}

export const jobsApi = {
  /**
   * Search for jobs across multiple connectors
   */
  async search(params: JobSearchParams): Promise<AggregatedSearchResult> {
    const searchParams = new URLSearchParams();

    if (params.q) searchParams.set("q", params.q);
    if (params.location) searchParams.set("location", params.location);
    if (params.radius) searchParams.set("radius", params.radius.toString());
    if (params.salary_min)
      searchParams.set("salary_min", params.salary_min.toString());
    if (params.salary_max)
      searchParams.set("salary_max", params.salary_max.toString());
    if (params.job_type) searchParams.set("job_type", params.job_type);
    if (params.remote !== undefined)
      searchParams.set("remote", params.remote.toString());
    if (params.sources) searchParams.set("sources", params.sources);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.per_page)
      searchParams.set("per_page", params.per_page.toString());

    const response = await apiClient.get<AggregatedSearchResult>(
      `/jobs/search?${searchParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get job details by source and ID
   */
  async getJob(source: string, jobId: string): Promise<Job> {
    const response = await apiClient.get<Job>(`/jobs/${source}/${jobId}`);
    return response.data;
  },

  /**
   * List available job connectors
   */
  async listConnectors(): Promise<ConnectorInfo[]> {
    const response = await apiClient.get<ConnectorInfo[]>("/jobs/connectors");
    return response.data;
  },
};
