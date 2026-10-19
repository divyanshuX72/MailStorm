/**
 * CLI — API Client
 * Axios-based HTTP client with JWT injection, auto-refresh, and error handling
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { configManager } from './config';
import { ApiResponse } from './types';

let apiClient: AxiosInstance;

/**
 * Get or create the API client singleton
 */
export function getApiClient(): AxiosInstance {
  if (apiClient) return apiClient;

  apiClient = axios.create({
    baseURL: configManager.getApiUrl() + '/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor — inject JWT
  apiClient.interceptors.request.use((config) => {
    const token = configManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor — handle 401 (token refresh)
  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      // If 401 and we haven't already tried refreshing
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = configManager.getRefreshToken();
          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          // Attempt token refresh
          const refreshResponse = await axios.post(
            `${configManager.getApiUrl()}/api/auth/refresh-token`,
            {},
            {
              headers: { Cookie: `refreshToken=${refreshToken}` },
              withCredentials: true,
            }
          );

          if (refreshResponse.data?.success && refreshResponse.data?.data?.accessToken) {
            const newToken = refreshResponse.data.data.accessToken;
            const newRefreshToken = refreshResponse.data.data.refreshToken;
            
            configManager.set('accessToken', newToken);
            if (newRefreshToken) {
              configManager.set('refreshToken', newRefreshToken);
            }

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        } catch {
          // Refresh failed — clear auth
          configManager.clearAuth();
          throw new Error('Session expired. Please login again.');
        }
      }

      // Format error message
      if (error.response?.data) {
        const data = error.response.data as any;
        throw new Error(data.message || data.error || `API Error: ${error.response.status}`);
      }

      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to API at ${configManager.getApiUrl()}. Is the backend running?`);
      }

      if (error.code === 'ETIMEDOUT') {
        throw new Error('Request timed out. Please try again.');
      }

      throw error;
    }
  );

  return apiClient;
}

/**
 * Type-safe API methods
 */
export const api = {
  async get<T = any>(path: string): Promise<ApiResponse<T>> {
    const response = await getApiClient().get(path);
    return response.data;
  },

  async post<T = any>(path: string, data?: any): Promise<ApiResponse<T>> {
    const response = await getApiClient().post(path, data);
    return response.data;
  },

  async put<T = any>(path: string, data?: any): Promise<ApiResponse<T>> {
    const response = await getApiClient().put(path, data);
    return response.data;
  },

  async delete<T = any>(path: string): Promise<ApiResponse<T>> {
    const response = await getApiClient().delete(path);
    return response.data;
  },
};
