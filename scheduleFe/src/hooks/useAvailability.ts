import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUserAvailability,
  setUserAvailability,
  createAvailabilityException,
  deleteAvailabilityException,
} from '@/api/users';
import { ToastService } from '@/shared/services/ToastService';
import type {
  SetAvailabilityBulkDto,
  CreateAvailabilityExceptionDto,
} from '@/shared/types/user';

export const useAvailability = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['availability', userId],
    queryFn: () => fetchUserAvailability(userId!),
    enabled: !!userId,
  });

  const setSchedule = useMutation({
    mutationFn: (dto: SetAvailabilityBulkDto) => setUserAvailability(userId!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', userId] });
      ToastService.success({ title: 'Availability saved', message: 'Your weekly schedule has been updated.' });
    },
    onError: () => {
      ToastService.error({ title: 'Error', message: 'Could not save availability.' });
    },
  });

  const addException = useMutation({
    mutationFn: (dto: CreateAvailabilityExceptionDto) => createAvailabilityException(userId!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', userId] });
      ToastService.success({ title: 'Exception added', message: 'Date override saved.' });
    },
    onError: () => {
      ToastService.error({ title: 'Error', message: 'Could not add exception.' });
    },
  });

  const removeException = useMutation({
    mutationFn: (exceptionId: string) => deleteAvailabilityException(userId!, exceptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', userId] });
      ToastService.success({ title: 'Exception removed', message: 'Date override deleted.' });
    },
    onError: () => {
      ToastService.error({ title: 'Error', message: 'Could not remove exception.' });
    },
  });

  return { ...query, setSchedule, addException, removeException };
};
