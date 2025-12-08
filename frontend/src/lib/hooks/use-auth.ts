/**
 * TanStack Query hooks for authentication operations
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { queryKeys } from "./query-keys";
import {
  authApi,
  type User,
  type LoginData,
  type RegisterData,
} from "@/lib/api/auth";

/**
 * Hook to fetch current user
 */
export function useUser(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: authApi.getMe,
    enabled:
      options?.enabled ??
      (typeof window !== "undefined" && !!localStorage.getItem("access_token")),
    retry: false, // Don't retry auth requests
    staleTime: 5 * 60 * 1000, // User data is fresh for 5 minutes
  });
}

/**
 * Hook for login mutation
 */
export function useLogin(
  options?: Omit<UseMutationOptions<User, Error, LoginData>, "mutationFn">
) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginData) => {
      const tokens = await authApi.login(data);
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      return authApi.getMe();
    },
    onSuccess: (user) => {
      // Set user in cache
      queryClient.setQueryData(queryKeys.auth.user(), user);
      router.push("/dashboard");
    },
    ...options,
  });
}

/**
 * Hook for registration mutation
 */
export function useRegister(
  options?: Omit<UseMutationOptions<User, Error, RegisterData>, "mutationFn">
) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const tokens = await authApi.register(data);
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      return authApi.getMe();
    },
    onSuccess: (user) => {
      // Set user in cache
      queryClient.setQueryData(queryKeys.auth.user(), user);
      router.push("/dashboard");
    },
    ...options,
  });
}

/**
 * Hook for logout mutation
 */
export function useLogout(
  options?: Omit<UseMutationOptions<void, Error, void>, "mutationFn">
) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch {
        // Ignore logout errors
      }
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    },
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
      router.push("/login");
    },
    ...options,
  });
}
