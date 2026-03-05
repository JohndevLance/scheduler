import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCurrentUser, updateMyProfile } from '@/api/users';
import { ToastService } from '@/shared/services/ToastService';
import { useAuthStore } from '@/store/authStore';
import type { UpdateUserDto } from '@/shared/types/user';
import axios from 'axios';

export const useCurrentUser = () => {
  const queryClient = useQueryClient();
  const { accessToken, refreshToken, setAuth } = useAuthStore();

  const query = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateProfile = useMutation({
    mutationFn: (dto: UpdateUserDto) => updateMyProfile(dto),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
      // Sync updated user back into auth store so navbar/header reflects changes
      setAuth(updatedUser, accessToken ?? '', refreshToken ?? '');
      ToastService.success({ title: 'Profile updated', message: 'Your profile has been saved.' });
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message ?? 'Failed to update profile'
        : 'Something went wrong';
      ToastService.error({ title: 'Error', message });
    },
  });

  return { ...query, updateProfile };
};
