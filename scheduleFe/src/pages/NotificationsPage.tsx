import { format } from 'date-fns';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationsPage = () => {
  const { data, isLoading, markRead, markAllRead } = useNotifications({ limit: 50 });
  const notifications = data?.data ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {data?.total ?? 0} total &bull; {notifications.filter((n) => !n.isRead).length} unread
          </p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* List */}
      <div className="rounded-xl border bg-white divide-y overflow-hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-72" />
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No notifications</p>
            <p className="mt-1 text-xs text-gray-400">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              className={cn(
                'w-full text-left px-5 py-4 transition-colors hover:bg-gray-50',
                !n.isRead && 'bg-blue-50/60 hover:bg-blue-50',
              )}
              onClick={() => {
                if (!n.isRead) markRead.mutate(n.id);
              }}
            >
              <div className="flex items-start gap-3">
                <div className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', n.isRead ? 'bg-transparent' : 'bg-blue-500')} />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm', n.isRead ? 'text-gray-700' : 'text-gray-900 font-medium')}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 leading-snug">{n.body}</p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {format(new Date(n.createdAt), 'MMM d, yyyy · h:mm a')}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {data && data.total > notifications.length && (
        <>
          <Separator />
          <p className="text-center text-xs text-gray-400">
            Showing {notifications.length} of {data.total}
          </p>
        </>
      )}
    </div>
  );
};

export default NotificationsPage;
