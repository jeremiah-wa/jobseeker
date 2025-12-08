/**
 * API client configuration using axios with structured logging
 */

import axios from "axios";

import { logger } from "@/lib/logger";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token and logging
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request (server-side only)
    if (typeof window === "undefined") {
      logger.debug(
        {
          event: "api_request_start",
          method: config.method?.toUpperCase(),
          url: config.url,
        },
        "API request started"
      );
    }

    return config;
  },
  (error) => {
    if (typeof window === "undefined") {
      logger.error(
        { event: "api_request_error", error: error.message },
        "API request failed"
      );
    }
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and logging
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response (server-side only)
    if (typeof window === "undefined") {
      logger.debug(
        {
          event: "api_response_success",
          method: response.config.method?.toUpperCase(),
          url: response.config.url,
          status: response.status,
        },
        "API request completed"
      );
    }
    return response;
  },
  async (error) => {
    // Log error response (server-side only)
    if (typeof window === "undefined") {
      logger.error(
        {
          event: "api_response_error",
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          status: error.response?.status,
          error: error.message,
        },
        "API request failed"
      );
    }

    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Try to refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;

        // Store new tokens
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
