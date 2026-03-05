import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import UsersPage from '@/pages/UsersPage';
import MyProfilePage from '@/pages/MyProfilePage';
import LocationsPage from '@/pages/LocationsPage';
import SchedulePage from '@/pages/SchedulePage';
import MySchedulePage from '@/pages/MySchedulePage';
import SwapsPage from '@/pages/SwapsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — wrapped in AppLayout (sidebar) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/my-schedule" element={<MySchedulePage />} />
          <Route path="/swaps" element={<SwapsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/profile" element={<MyProfilePage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
