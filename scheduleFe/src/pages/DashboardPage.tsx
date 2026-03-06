import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, startOfWeek, addDays, differenceInMinutes, isFuture, isAfter } from 'date-fns';
import {
  CalendarDays,
  Clock,
  ArrowLeftRight,
  Bell,
  ChevronRight,
  Users,
  MapPin,
  BarChart3,
  UserCircle,
  Calendar,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMyWeeklySchedule } from '@/hooks/useSchedule';
import { useShifts } from '@/hooks/useShifts';
import { useSwaps } from '@/hooks/useSwaps';
import { useNotifications, useUnreadCount } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fmtTimeInTz } from '@/utils/dateTime';
import type { Shift } from '@/shared/types/shift';

// ─── helpers ────────────────────────────────────────────────────────────────

const toYMD = (d: Date) => format(d, 'yyyy-MM-dd');

const shiftHours = (shifts: Shift[]) =>
  shifts.reduce((sum, s) => {
    const mins = differenceInMinutes(new Date(s.endTime), new Date(s.startTime));
    return sum + mins / 60;
  }, 0);

const SWAP_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending_acceptance: { label: 'Pending acceptance', cls: 'bg-blue-100 text-blue-700' },
  pending_approval: { label: 'Awaiting approval', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500' },
  expired: { label: 'Expired', cls: 'bg-gray-100 text-gray-400' },
};

const NOTIF_TYPE_COLORS: Record<string, string> = {
  shift_assigned: 'bg-green-100 text-green-700',
  shift_unassigned: 'bg-red-100 text-red-700',
  shift_changed: 'bg-blue-100 text-blue-700',
  shift_cancelled: 'bg-gray-100 text-gray-500',
  swap_requested: 'bg-purple-100 text-purple-700',
  swap_accepted: 'bg-green-100 text-green-700',
  swap_approved: 'bg-green-100 text-green-700',
  swap_denied: 'bg-red-100 text-red-700',
  schedule_published: 'bg-indigo-100 text-indigo-700',
};

// ─── skeleton helpers ────────────────────────────────────────────────────────

const StatSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-28" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16" />
    </CardContent>
  </Card>
);

const ListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-14 w-full" />
    ))}
  </div>
);

// ─── component ───────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';
  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';

  const now = new Date();
  const weekStart = toYMD(startOfWeek(now, { weekStartsOn: 1 }));
  const weekEnd = toYMD(addDays(startOfWeek(now, { weekStartsOn: 1 }), 6));
  const todayYMD = toYMD(now);
  const nextWeekYMD = toYMD(addDays(now, 7));

  // ── data fetching ──────────────────────────────────────────────────────────

  // Staff: own schedule for this week
  const { data: myShifts, isLoading: myShiftsLoading } = useMyWeeklySchedule(weekStart);

  // Manager/Admin: upcoming published shifts (next 7 days)
  const { data: upcomingShiftData, isLoading: upcomingLoading } = useShifts(
    isManagerOrAdmin
      ? { startDate: todayYMD, endDate: nextWeekYMD, status: 'published', limit: 10 }
      : undefined,
  );

  // Manager/Admin: all published shifts this week for hours total
  const { data: weekShiftData } = useShifts(
    isManagerOrAdmin ? { startDate: weekStart, endDate: weekEnd, status: 'published', limit: 200 } : undefined,
  );

  // Swaps
  const { data: swapsData, isLoading: swapsLoading } = useSwaps(
    isManagerOrAdmin ? { status: 'pending_approval', limit: 5 } : { limit: 50 },
  );

  // Notifications
  const { data: notifData, isLoading: notifsLoading, markRead } = useNotifications({ unreadOnly: true, limit: 5 });
  const { data: unreadCount } = useUnreadCount();

  // ── derived values ─────────────────────────────────────────────────────────

  const hoursThisWeek = useMemo(() => {
    if (isStaff) return shiftHours(myShifts ?? []);
    return shiftHours(weekShiftData?.data ?? []);
  }, [isStaff, myShifts, weekShiftData]);

  const upcomingShifts = useMemo((): Shift[] => {
    if (isStaff) {
      return (myShifts ?? [])
        .filter((s) => isFuture(new Date(s.startTime)))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5);
    }
    return (upcomingShiftData?.data ?? [])
      .filter((s) => isAfter(new Date(s.startTime), now))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  }, [isStaff, myShifts, upcomingShiftData, now]);

  const pendingSwaps = useMemo(() => {
    const all = swapsData?.data ?? [];
    if (isManagerOrAdmin) return all; // already filtered to pending_approval
    return all.filter((s) =>
      s.status === 'pending_acceptance' || s.status === 'pending_approval',
    );
  }, [isManagerOrAdmin, swapsData]);

  const notifications = notifData?.data ?? [];

  // ── quick actions config ───────────────────────────────────────────────────

  const quickActions = useMemo(() => {
    if (user?.role === 'staff') {
      return [
        { label: 'My Schedule', icon: CalendarDays, to: '/my-schedule', color: 'text-blue-600' },
        { label: 'Swaps', icon: ArrowLeftRight, to: '/swaps', color: 'text-purple-600' },
        { label: 'Notifications', icon: Bell, to: '/notifications', color: 'text-yellow-600' },
        { label: 'My Profile', icon: UserCircle, to: '/profile', color: 'text-gray-600' },
      ];
    }
    if (user?.role === 'manager') {
      return [
        { label: 'Schedule', icon: Calendar, to: '/schedule', color: 'text-blue-600' },
        { label: 'Swaps', icon: ArrowLeftRight, to: '/swaps', color: 'text-purple-600' },
        { label: 'Users', icon: Users, to: '/users', color: 'text-green-600' },
        { label: 'Analytics', icon: BarChart3, to: '/analytics', color: 'text-orange-600' },
      ];
    }
    // admin
    return [
      { label: 'Schedule', icon: Calendar, to: '/schedule', color: 'text-blue-600' },
      { label: 'Swaps', icon: ArrowLeftRight, to: '/swaps', color: 'text-purple-600' },
      { label: 'Users', icon: Users, to: '/users', color: 'text-green-600' },
      { label: 'Locations', icon: MapPin, to: '/locations', color: 'text-red-600' },
      { label: 'Analytics', icon: BarChart3, to: '/analytics', color: 'text-orange-600' },
    ];
  }, [user?.role]);

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, {user?.firstName} {user?.lastName}
            <span className="ml-2 capitalize text-xs font-medium text-gray-400">({user?.role})</span>
          </p>
        </div>
        <p className="text-sm text-gray-400">{format(now, 'EEE, MMM d yyyy')}</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Hours this week */}
        {myShiftsLoading || upcomingLoading ? (
          <StatSkeleton />
        ) : (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">Hours this week</CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{hoursThisWeek.toFixed(1)}</p>
              <p className="text-xs text-gray-400 mt-1">{weekStart} – {weekEnd}</p>
            </CardContent>
          </Card>
        )}

        {/* Upcoming shifts */}
        {myShiftsLoading || upcomingLoading ? (
          <StatSkeleton />
        ) : (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">Upcoming shifts</CardTitle>
              <CalendarDays className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{upcomingShifts.length}</p>
              <p className="text-xs text-gray-400 mt-1">Next 7 days</p>
            </CardContent>
          </Card>
        )}

        {/* Pending swaps */}
        {swapsLoading ? (
          <StatSkeleton />
        ) : (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">
                {isManagerOrAdmin ? 'Awaiting approval' : 'Pending swaps'}
              </CardTitle>
              <ArrowLeftRight className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{pendingSwaps.length}</p>
              <p className="text-xs text-gray-400 mt-1">
                {isManagerOrAdmin ? 'Need your review' : 'Requires action'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Unread notifications */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Unread notifications</CardTitle>
            <Bell className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{unreadCount ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">
              <Link to="/notifications" className="hover:underline text-blue-500">View all</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main two-column section ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Upcoming Shifts panel */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Upcoming Shifts</CardTitle>
            <Link
              to={isStaff ? '/my-schedule' : '/schedule'}
              className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {myShiftsLoading || upcomingLoading ? (
              <ListSkeleton />
            ) : upcomingShifts.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No upcoming shifts in the next 7 days.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingShifts.map((shift) => {
                  const tz = shift.location?.timezone ?? 'UTC';
                  return (
                    <li
                      key={shift.id}
                      className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {shift.location?.name ?? 'Unknown location'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(shift.startTime), 'EEE, MMM d')}
                          {' · '}
                          {fmtTimeInTz(shift.startTime, tz)} – {fmtTimeInTz(shift.endTime, tz)}
                        </p>
                        {isManagerOrAdmin && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {(shift.assignedUsers?.length ?? shift.assignments?.length ?? 0)}/{shift.headcount} assigned
                          </p>
                        )}
                      </div>
                      <Badge className={`ml-2 mt-0.5 shrink-0 text-xs ${
                        shift.status === 'published' ? 'bg-green-100 text-green-700' :
                        shift.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      } border-0`}>
                        {shift.status}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Notifications panel */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Notifications</CardTitle>
            <Link
              to="/notifications"
              className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {notifsLoading ? (
              <ListSkeleton />
            ) : notifications.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">You're all caught up — no unread notifications.</p>
            ) : (
              <ul className="space-y-2">
                {notifications.map((notif) => {
                  const badge = NOTIF_TYPE_COLORS[notif.type] ?? 'bg-gray-100 text-gray-600';
                  return (
                    <li
                      key={notif.id}
                      className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge}`}>
                            {notif.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">{notif.title}</p>
                        <p className="text-xs text-gray-500 truncate">{notif.body}</p>
                      </div>
                      <button
                        onClick={() => markRead.mutate(notif.id)}
                        disabled={markRead.isPending}
                        title="Mark as read"
                        className="mt-0.5 shrink-0 text-gray-300 hover:text-green-500 transition-colors"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Pending swap approvals (manager / admin only) ── */}
      {isManagerOrAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Pending Swap Approvals</CardTitle>
            <Link
              to="/swaps"
              className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
            >
              Manage all <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {swapsLoading ? (
              <ListSkeleton />
            ) : pendingSwaps.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No swaps currently awaiting approval.</p>
            ) : (
              <ul className="space-y-2">
                {pendingSwaps.map((swap) => {
                  const statusMeta = SWAP_STATUS_LABELS[swap.status] ?? { label: swap.status, cls: 'bg-gray-100 text-gray-500' };
                  return (
                    <li
                      key={swap.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {swap.requester
                            ? `${swap.requester.firstName} ${swap.requester.lastName}`
                            : 'Unknown'}
                          {swap.type === 'swap' && swap.cover && (
                            <span className="text-gray-500 font-normal"> → {swap.cover.firstName} {swap.cover.lastName}</span>
                          )}
                          {swap.type === 'drop' && (
                            <span className="text-gray-500 font-normal"> (drop request)</span>
                          )}
                        </p>
                        {swap.shift && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {format(new Date(swap.shift.startTime), 'EEE, MMM d · h:mm a')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusMeta.cls}`}>
                          {statusMeta.label}
                        </span>
                        <Link to="/swaps">
                          <Button size="sm" variant="outline" className="h-7 text-xs">Review</Button>
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Quick actions ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {quickActions.map(({ label, icon: Icon, to, color }) => (
              <Link key={to} to={to}>
                <Button variant="outline" className="flex items-center gap-2 h-10">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span>{label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
