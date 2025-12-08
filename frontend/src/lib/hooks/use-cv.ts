/**
 * TanStack Query hooks for CV operations
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  cvApi,
  type CV,
  type CVUploadResponse,
  type CVParseResponse,
  type ParsedCV,
} from "@/lib/api/cv";

/**
 * Hook to fetch list of CVs
 */
export function useCVs() {
  return useQuery({
    queryKey: queryKeys.cvs.list(),
    queryFn: cvApi.list,
  });
}

/**
 * Hook to fetch a single CV by ID
 */
export function useCV(cvId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.cvs.detail(cvId),
    queryFn: () => cvApi.get(cvId),
    enabled: options?.enabled ?? !!cvId,
    // Refetch more frequently when CV is processing
    refetchInterval: (query) => {
      const cv = query.state.data as CV | undefined;
      if (
        cv?.parsing_status === "processing" ||
        cv?.parsing_status === "pending"
      ) {
        return 2000; // Poll every 2 seconds
      }
      return false;
    },
  });
}

/**
 * Hook to get PDF preview URL
 */
export function useCVPreview(cvId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.cvs.preview(cvId),
    queryFn: () => cvApi.getPreviewUrl(cvId),
    enabled: options?.enabled ?? !!cvId,
    staleTime: 5 * 60 * 1000, // Preview URL valid for 5 minutes
  });
}

/**
 * Hook to upload a CV
 */
export function useUploadCV(
  options?: UseMutationOptions<CVUploadResponse, Error, File>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cvApi.upload,
    onSuccess: () => {
      // Invalidate CV list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.cvs.lists() });
    },
    ...options,
  });
}

/**
 * Hook to delete a CV
 */
export function useDeleteCV(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cvApi.delete,
    onSuccess: (_, cvId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.cvs.detail(cvId) });
      queryClient.removeQueries({ queryKey: queryKeys.cvs.preview(cvId) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: queryKeys.cvs.lists() });
    },
    ...options,
  });
}

/**
 * Hook to set a CV as primary
 */
export function useSetPrimaryCV(
  options?: UseMutationOptions<CV, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cvApi.setPrimary,
    onSuccess: (updatedCV) => {
      // Update the specific CV in cache
      queryClient.setQueryData(queryKeys.cvs.detail(updatedCV.id), updatedCV);
      // Invalidate list to update primary status across all CVs
      queryClient.invalidateQueries({ queryKey: queryKeys.cvs.lists() });
    },
    ...options,
  });
}

/**
 * Hook to parse a CV
 */
export function useParseCV(
  options?: UseMutationOptions<CVParseResponse, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cvApi.parse,
    onSuccess: (result, cvId) => {
      // Invalidate to refetch with new parsing status
      queryClient.invalidateQueries({ queryKey: queryKeys.cvs.detail(cvId) });
    },
    ...options,
  });
}

/**
 * Hook to update parsed CV data
 */
export function useUpdateParsedData(
  options?: UseMutationOptions<
    CV,
    Error,
    { cvId: string; data: Partial<ParsedCV> }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cvId, data }) => cvApi.updateParsedData(cvId, data),
    onSuccess: (updatedCV) => {
      // Update the specific CV in cache
      queryClient.setQueryData(queryKeys.cvs.detail(updatedCV.id), updatedCV);
    },
    ...options,
  });
}

/**
 * Hook to download a CV (not cached, just triggers download)
 */
export function useDownloadCV() {
  return useMutation({
    mutationFn: ({ cvId, filename }: { cvId: string; filename: string }) =>
      cvApi.download(cvId, filename),
  });
}
