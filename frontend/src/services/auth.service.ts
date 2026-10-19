/**
 * Auth API Service
 */

import api from './api';
import type { User, ApiResponse } from '@/types';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string; company?: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),

  logout: () =>
    api.post<ApiResponse>('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh-token', { refreshToken }),

  getProfile: () =>
    api.get<ApiResponse<User>>('/auth/profile'),

  updateProfile: (data: { name?: string; phone?: string; company?: string }) =>
    api.put<ApiResponse<User>>('/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<ApiResponse>('/auth/change-password', data),

  forgotPassword: (email: string) =>
    api.post<ApiResponse>('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string }) =>
    api.post<ApiResponse>('/auth/reset-password', data),
};
