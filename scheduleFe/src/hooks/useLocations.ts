import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  fetchLocationStaff,
  certifyStaff,
  decertifyStaff,
} from '@/api/locations';
import { ToastService } from '@/shared/services/ToastService';
import type {
  CreateLocationDto,
  UpdateLocationDto,
  CertifyStaffDto,
  DecertifyStaffDto,
} from '@/shared/types/location';
import axios from 'axios';

const errMsg = (error: unknown, fallback: string) =>
  axios.isAxiosError(error)
    ? (error.response?.data as { message?: string })?.message ?? fallback
    : fallback;

export const useLocations = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
  });

  const create = useMutation({
    mutationFn: (dto: CreateLocationDto) => createLocation(dto),
    onSuccess: (loc) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      ToastService.success({ title: 'Location created', message: `"${loc.name}" has been added.` });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Failed to create location') }),
  });

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLocationDto }) => updateLocation({ id, dto }),
    onSuccess: (loc) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location', loc.id] });
      ToastService.success({ title: 'Location updated', message: `"${loc.name}" has been saved.` });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Failed to update location') }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      ToastService.success({ title: 'Location removed', message: 'Location has been deactivated.' });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Failed to remove location') }),
  });

  return { ...query, create, update, remove };
};

export const useLocationStaff = (locationId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['location-staff', locationId],
    queryFn: () => fetchLocationStaff(locationId),
    enabled: !!locationId,
  });

  const certify = useMutation({
    mutationFn: (dto: CertifyStaffDto) => certifyStaff(locationId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-staff', locationId] });
      ToastService.success({ title: 'Staff certified', message: 'Staff member has been certified for this location.' });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Failed to certify staff') }),
  });

  const decertify = useMutation({
    mutationFn: (dto: DecertifyStaffDto) => decertifyStaff(locationId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-staff', locationId] });
      ToastService.success({ title: 'Staff removed', message: 'Certification has been revoked.' });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Failed to decertify staff') }),
  });

  return { ...query, certify, decertify };
};
