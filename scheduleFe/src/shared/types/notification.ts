import type { PaginationParams } from './common';

export type NotificationType =
  | 'shift_assigned'
  | 'shift_unassigned'
  | 'shift_published'
  | 'shift_cancelled'
  | 'swap_requested'
  | 'swap_accepted'
  | 'swap_approved'
  | 'swap_denied'
  | 'swap_cancelled'
  | string;

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  data?: Record<string, unknown> | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationsQueryParams extends PaginationParams {
  unreadOnly?: boolean;
}
