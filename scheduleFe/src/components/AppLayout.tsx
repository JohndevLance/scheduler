import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/hooks/useNotifications';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ArrowLeftRight,
  Bell,
  BarChart3,
  User,
  LogOut,
  MapPin,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    to: '/users',
    label: 'Users',
    icon: <Users className="h-4 w-4" />,
    roles: ['admin', 'manager'],
  },
  {
    to: '/locations',
    label: 'Locations',
    icon: <MapPin className="h-4 w-4" />,
    roles: ['admin', 'manager'],
  },
  {
    to: '/schedule',
    label: 'Schedule',
    icon: <CalendarDays className="h-4 w-4" />,
    roles: ['admin', 'manager'],
  },
  {
    to: '/my-schedule',
    label: 'My Schedule',
    icon: <CalendarDays className="h-4 w-4" />,
  },
  {
    to: '/swaps',
    label: 'Swap Requests',
    icon: <ArrowLeftRight className="h-4 w-4" />,
  },
  {
    to: '/notifications',
    label: 'Notifications',
    icon: <Bell className="h-4 w-4" />,
  },
  {
    to: '/analytics',
    label: 'Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    roles: ['admin', 'manager'],
  },
];

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();

  const initials = user
    ? `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase() || '??'
    : '??';

  const visibleNav = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r bg-white">
        {/* Brand */}
        <div className="flex h-14 items-center px-4">
          <span className="text-lg font-bold tracking-tight text-gray-900">ShiftSync</span>
        </div>
        <Separator />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Separator />

        {/* User section */}
        <div className="p-3 space-y-1">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
              )
            }
          >
            <User className="h-4 w-4" />
            My Profile
          </NavLink>

          <div className="flex items-center gap-2 px-3 py-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs capitalize text-gray-500">{user?.role}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 text-gray-500 hover:text-gray-900"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center border-b bg-white px-6">
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {user?.firstName} {user?.lastName}
            </span>
            {/* Notification bell */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
