/**
 * Authentication context provider
 */

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  authApi,
  type User,
  type LoginData,
  type RegisterData,
} from "@/lib/api/auth";

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (token) {
          const userData = await authApi.getMe();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        // Clear invalid tokens
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (data: LoginData) => {
    const tokens = await authApi.login(data);
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);

    const userData = await authApi.getMe();
    setUser(userData);
    router.push("/dashboard");
  };

  const register = async (data: RegisterData) => {
    const tokens = await authApi.register(data);
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);

    const userData = await authApi.getMe();
    setUser(userData);
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
