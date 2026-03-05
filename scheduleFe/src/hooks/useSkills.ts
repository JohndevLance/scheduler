import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSkills, createSkill } from '@/api/users';
import { ToastService } from '@/shared/services/ToastService';
import axios from 'axios';

export const useSkills = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['skills'],
    queryFn: fetchSkills,
    staleTime: 1000 * 60 * 10, // 10 minutes — skills rarely change
  });

  const create = useMutation({
    mutationFn: (name: string) => createSkill(name),
    onSuccess: (skill) => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      ToastService.success({ title: 'Skill created', message: `"${skill.name}" has been added.` });
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message ?? 'Failed to create skill'
        : 'Something went wrong';
      ToastService.error({ title: 'Error', message });
    },
  });

  return { ...query, create };
};
