import apiClient from './axiosInstance';
import type { ApiEnvelope } from '@/shared/types/auth';
import type { FlatPaginatedResponse } from '@/shared/types/common';
import type {
  Notification,
  UnreadCountResponse,
  NotificationsQueryParams,
} from '@/shared/types/notification';

export const fetchNotifications = async (
  params?: NotificationsQueryParams,
): Promise<FlatPaginatedResponse<Notification>> => {
  const { data } = await apiClient.get<ApiEnvelope<FlatPaginatedResponse<Notification>>>(
    '/notifications',
    { params },
  );
  return data.data;
};

export const fetchUnreadCount = async (): Promise<number> => {
  const { data } = await apiClient.get<ApiEnvelope<UnreadCountResponse>>(
    '/notifications/unread-count',
  );
  return data.data.count;
};

export const markNotificationRead = async (id: string): Promise<Notification> => {
  const { data } = await apiClient.patch<ApiEnvelope<Notification>>(
    `/notifications/${id}/read`,
  );
  return data.data;
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await apiClient.patch('/notifications/read-all');
};
