import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  fetchShifts,
  createShift,
  updateShift,
  deleteShift,
  publishShift,
  unpublishShift,
  assignStaff,
  unassignStaff,
  fetchMyShifts,
} from '@/api/shifts';
import { ToastService } from '@/shared/services/ToastService';
import type { CreateShiftDto, UpdateShiftDto, AssignStaffDto, ShiftsQueryParams } from '@/shared/types/shift';
import axios from 'axios';

const errMsg = (error: unknown, fallback: string) =>
  axios.isAxiosError(error)
    ? (error.response?.data as { message?: string })?.message ?? fallback
    : fallback;

/** Returns true when the API responded with a constraint-violation payload */
const isConstraintViolation = (error: unknown) =>
  axios.isAxiosError(error) &&
  Array.isArray((error.response?.data as Record<string, unknown>)?.violations);

const invalidateShifts = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['shifts'] });
  queryClient.invalidateQueries({ queryKey: ['schedule'] });
  queryClient.invalidateQueries({ queryKey: ['my-schedule'] });
  queryClient.invalidateQueries({ queryKey: ['shift'] }); // invalidates ['shift', id] detail queries
};

export const useShifts = (params?: ShiftsQueryParams) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['shifts', params],
    queryFn: () => fetchShifts(params),
    placeholderData: keepPreviousData,
  });

  const create = useMutation({
    mutationFn: (dto: CreateShiftDto) => createShift(dto),
    onSuccess: () => {
      invalidateShifts(queryClient);
      ToastService.success({ title: 'Shift created', message: 'New shift has been added.' });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Failed to create shift') }),
  });

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateShiftDto }) => updateShift({ id, dto }),
    onSuccess: () => {
      invalidateShifts(queryClient);
      ToastService.success({ title: 'Shift updated', message: 'Changes have been saved.' });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Failed to update shift') }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteShift(id),
    onSuccess: () => {
      invalidateShifts(queryClient);
      ToastService.success({ title: 'Shift deleted', message: 'Shift has been removed.' });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Failed to delete shift') }),
  });

  const publish = useMutation({
    mutationFn: (id: string) => publishShift(id),
    onSuccess: () => {
      invalidateShifts(queryClient);
      ToastService.success({ title: 'Shift published', message: 'Staff can now see this shift.' });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Failed to publish shift') }),
  });

  const unpublish = useMutation({
    mutationFn: (id: string) => unpublishShift(id),
    onSuccess: () => {
      invalidateShifts(queryClient);
      ToastService.success({ title: 'Shift unpublished', message: 'Shift moved back to draft.' });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Failed to unpublish shift') }),
  });

  const assign = useMutation({
    mutationFn: ({ shiftId, dto, override }: { shiftId: string; dto: AssignStaffDto; override?: boolean }) =>
      assignStaff(shiftId, dto, override),
    onSuccess: () => {
      invalidateShifts(queryClient);
      ToastService.success({ title: 'Staff assigned', message: 'Staff member has been added to this shift.' });
    },
    // Constraint violations are handled in the component; only toast for other errors
    onError: (e) => {
      if (!isConstraintViolation(e)) {
        ToastService.error({ title: 'Error', message: errMsg(e, 'Failed to assign staff') });
      }
    },
  });

  const unassign = useMutation({
    mutationFn: ({ shiftId, userId }: { shiftId: string; userId: string }) =>
      unassignStaff(shiftId, userId),
    onSuccess: () => {
      invalidateShifts(queryClient);
      ToastService.success({ title: 'Staff removed', message: 'Assignment has been removed.' });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Failed to unassign staff') }),
  });

  return { ...query, create, update, remove, publish, unpublish, assign, unassign };
};

export const useMyShifts = (params?: ShiftsQueryParams) => {
  return useQuery({
    queryKey: ['my-shifts', params],
    queryFn: () => fetchMyShifts(params),
    placeholderData: keepPreviousData,
  });
};
