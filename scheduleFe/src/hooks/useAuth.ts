import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '@/api/auth';
import { useAuthContext } from '@/contexts/AuthContext';
import { ToastService } from '@/shared/services/ToastService';
import type { LoginDto, RegisterDto } from '@/shared/types/auth';
import axios from 'axios';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setAuth, logout } = useAuthContext();
  const navigate = useNavigate();

  const login = useMutation({
    mutationFn: (dto: LoginDto) => loginUser(dto),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      ToastService.success({ title: 'Welcome back!', message: `Logged in as ${data.user.firstName}` });
      navigate('/dashboard');
    },
    onError: (error: unknown) => {
      console.error('[login error]', error);
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message ?? 'Invalid credentials'
        : error instanceof Error
          ? error.message
          : 'Something went wrong';
      ToastService.error({ title: 'Login failed', message });
    },
  });

  const register = useMutation({
    mutationFn: (dto: RegisterDto) => registerUser(dto),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      ToastService.success({ title: 'Account created!', message: `Welcome, ${data.user.firstName}` });
      navigate('/dashboard');
    },
    onError: (error: unknown) => {
      console.error('[register error]', error);
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message ?? 'Registration failed'
        : error instanceof Error
          ? error.message
          : 'Something went wrong';
      ToastService.error({ title: 'Registration failed', message });
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
    ToastService.info({ title: 'Logged out', message: 'See you next time!' });
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout: handleLogout,
  };
};
