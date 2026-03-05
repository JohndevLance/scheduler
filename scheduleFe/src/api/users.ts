import apiClient from './axiosInstance';
import type { User, ApiEnvelope } from '@/shared/types/auth';
import type { PaginatedResponse } from '@/shared/types/common';
import type {
  Skill,
  Availability,
  AvailabilityException,
  CreateUserDto,
  UpdateUserDto,
  SetAvailabilityBulkDto,
  CreateAvailabilityExceptionDto,
  UsersQueryParams,
} from '@/shared/types/user';

export const fetchUsers = async (
  params?: UsersQueryParams,
): Promise<PaginatedResponse<User>> => {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResponse<User>>>('/users', { params });
  return data.data;
};

export const fetchCurrentUser = async (): Promise<User> => {
  const { data } = await apiClient.get<ApiEnvelope<User>>('/users/me');
  return data.data;
};

export const fetchUserById = async (id: string): Promise<User> => {
  const { data } = await apiClient.get<ApiEnvelope<User>>(`/users/${id}`);
  return data.data;
};

export const createUser = async (dto: CreateUserDto): Promise<User> => {
  const { data } = await apiClient.post<ApiEnvelope<User>>('/users', dto);
  return data.data;
};

export const updateUser = async ({
  id,
  dto,
}: {
  id: string;
  dto: UpdateUserDto;
}): Promise<User> => {
  const { data } = await apiClient.patch<ApiEnvelope<User>>(`/users/${id}`, dto);
  return data.data;
};

export const updateMyProfile = async (dto: UpdateUserDto): Promise<User> => {
  const { data } = await apiClient.patch<ApiEnvelope<User>>('/users/me/profile', dto);
  return data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};

export const fetchUserAvailability = async (id: string): Promise<Availability[]> => {
  const { data } = await apiClient.get<ApiEnvelope<Availability[]>>(
    `/users/${id}/availability`,
  );
  return data.data;
};

export const setUserAvailability = async (
  id: string,
  dto: SetAvailabilityBulkDto,
): Promise<Availability[]> => {
  const { data } = await apiClient.post<ApiEnvelope<Availability[]>>(
    `/users/${id}/availability`,
    dto,
  );
  return data.data;
};

export const createAvailabilityException = async (
  id: string,
  dto: CreateAvailabilityExceptionDto,
): Promise<AvailabilityException> => {
  const { data } = await apiClient.post<ApiEnvelope<AvailabilityException>>(
    `/users/${id}/availability/exceptions`,
    dto,
  );
  return data.data;
};

export const deleteAvailabilityException = async (
  id: string,
  exceptionId: string,
): Promise<void> => {
  await apiClient.delete(`/users/${id}/availability/exceptions/${exceptionId}`);
};

export const fetchSkills = async (): Promise<Skill[]> => {
  const { data } = await apiClient.get<ApiEnvelope<Skill[]>>('/users/skills/all');
  return data.data;
};

export const createSkill = async (name: string): Promise<Skill> => {
  const { data } = await apiClient.post<ApiEnvelope<Skill>>('/users/skills', { name });
  return data.data;
};
