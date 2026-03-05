import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchUsers, createUser, updateUser, deleteUser } from '@/api/users';
import { ToastService } from '@/shared/services/ToastService';
import type { UsersQueryParams } from '@/shared/types/user';
import type { CreateUserDto, UpdateUserDto } from '@/shared/types/user';
import axios from 'axios';

export const useUsers = (params?: UsersQueryParams) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['users', params],
    queryFn: () => fetchUsers(params),
    placeholderData: keepPreviousData,
  });

  const create = useMutation({
    mutationFn: (dto: CreateUserDto) => createUser(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      ToastService.success({
        title: 'User created',
        message: `${data.firstName} ${data.lastName} has been added.`,
      });
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message ?? 'Failed to create user'
        : 'Something went wrong';
      ToastService.error({ title: 'Error', message });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) => updateUser({ id, dto }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
      ToastService.success({
        title: 'User updated',
        message: `${data.firstName} ${data.lastName} has been updated.`,
      });
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message ?? 'Failed to update user'
        : 'Something went wrong';
      ToastService.error({ title: 'Error', message });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      ToastService.success({ title: 'User removed', message: 'The user has been deactivated.' });
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message ?? 'Failed to remove user'
        : 'Something went wrong';
      ToastService.error({ title: 'Error', message });
    },
  });

  return { ...query, create, update, remove };
};
