import apiClient from './axiosInstance';
import type { AuthResponse, ApiEnvelope, LoginDto, RegisterDto, RefreshTokenDto } from '@/shared/types/auth';

export const loginUser = async (dto: LoginDto): Promise<AuthResponse> => {
  const { data } = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/login', dto);
  return data.data;
};

export const registerUser = async (dto: RegisterDto): Promise<AuthResponse> => {
  const { data } = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/register', dto);
  return data.data;
};

export const refreshToken = async (dto: RefreshTokenDto): Promise<AuthResponse> => {
  const { data } = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/refresh', dto);
  return data.data;
};
