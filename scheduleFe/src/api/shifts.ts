import apiClient from './axiosInstance';
import type { ApiEnvelope } from '@/shared/types/auth';
import type { PaginatedResponse } from '@/shared/types/common';
import type {
  Shift,
  CreateShiftDto,
  UpdateShiftDto,
  AssignStaffDto,
  ShiftsQueryParams,
} from '@/shared/types/shift';

export const fetchShifts = async (params?: ShiftsQueryParams): Promise<PaginatedResponse<Shift>> => {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResponse<Shift>>>('/shifts', { params });
  return data.data;
};

export const fetchShiftById = async (id: string): Promise<Shift> => {
  const { data } = await apiClient.get<ApiEnvelope<Shift>>(`/shifts/${id}`);
  return data.data;
};

export const createShift = async (dto: CreateShiftDto): Promise<Shift> => {
  const { data } = await apiClient.post<ApiEnvelope<Shift>>('/shifts', dto);
  return data.data;
};

export const updateShift = async ({ id, dto }: { id: string; dto: UpdateShiftDto }): Promise<Shift> => {
  const { data } = await apiClient.patch<ApiEnvelope<Shift>>(`/shifts/${id}`, dto);
  return data.data;
};

export const deleteShift = async (id: string): Promise<void> => {
  await apiClient.delete(`/shifts/${id}`);
};

export const publishShift = async (id: string): Promise<Shift> => {
  const { data } = await apiClient.post<ApiEnvelope<Shift>>(`/shifts/${id}/publish`);
  return data.data;
};

export const unpublishShift = async (id: string): Promise<Shift> => {
  const { data } = await apiClient.post<ApiEnvelope<Shift>>(`/shifts/${id}/unpublish`);
  return data.data;
};

export const assignStaff = async (
  shiftId: string,
  dto: AssignStaffDto,
  override = false,
): Promise<Shift> => {
  const { data } = await apiClient.post<ApiEnvelope<Shift>>(
    `/shifts/${shiftId}/assign`,
    dto,
    { params: override ? { override: true } : undefined },
  );
  return data.data;
};

export const unassignStaff = async (shiftId: string, userId: string): Promise<void> => {
  await apiClient.delete(`/shifts/${shiftId}/assign/${userId}`);
};

export const fetchMyShifts = async (params?: ShiftsQueryParams): Promise<PaginatedResponse<Shift>> => {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResponse<Shift>>>('/shifts/my/schedule', { params });
  return data.data;
};
