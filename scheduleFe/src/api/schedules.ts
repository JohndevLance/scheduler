import apiClient from './axiosInstance';
import type { WeeklySchedule, Shift } from '@/shared/types/shift';

export const fetchWeeklySchedule = async (
  locationId: string,
  start: string, // ISO date YYYY-MM-DD
): Promise<WeeklySchedule> => {
  const { data } = await apiClient.get<{ data: WeeklySchedule }>(
    `/schedules/${locationId}/week`,
    { params: { start } },
  );
  return data.data;
};

export const fetchMyWeeklySchedule = async (start: string): Promise<Shift[]> => {
  const { data } = await apiClient.get<{ data: Shift[] }>('/schedules/my/week', {
    params: { start },
  });
  return data.data;
};

export const exportWeeklySchedule = async (
  locationId: string,
  start: string,
): Promise<Blob> => {
  const response = await apiClient.get(
    `/schedules/${locationId}/week/export`,
    { params: { start }, responseType: 'blob' },
  );
  return response.data as Blob;
};
