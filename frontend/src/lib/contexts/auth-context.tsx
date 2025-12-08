/**
 * Authentication context provider using TanStack Query
 */

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { type User, type LoginData, type RegisterData } from "@/lib/api/auth";
import {
  useUser,
  useLogin,
  useRegister,
  useLogout,
} from "@/lib/hooks/use-auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use TanStack Query for user state
  const { data: user, isLoading: isUserLoading } = useUser();

  // Mutation hooks for auth actions
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  // Wrapper functions to maintain Promise-based API
  const login = async (data: LoginData) => {
    await loginMutation.mutateAsync(data);
  };

  const register = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Loading state includes initial user fetch and ongoing mutations
  const isLoading =
    isUserLoading ||
    loginMutation.isPending ||
    registerMutation.isPending ||
    logoutMutation.isPending;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
