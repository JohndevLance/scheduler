import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/api/notifications';
import { ToastService } from '@/shared/services/ToastService';
import type { NotificationsQueryParams } from '@/shared/types/notification';

export const useNotifications = (params?: NotificationsQueryParams) => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
  };

  const query = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => fetchNotifications(params),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => invalidate(),
  });

  const markAllRead = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      invalidate();
      ToastService.success({ title: 'Done', message: 'All notifications marked as read.' });
    },
  });

  return { ...query, markRead, markAllRead };
};

export const useUnreadCount = () =>
  useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: fetchUnreadCount,
    // Poll every 30 seconds for near-real-time badge updates
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
