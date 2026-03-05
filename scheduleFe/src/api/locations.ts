import apiClient from './axiosInstance';
import type { ApiEnvelope } from '@/shared/types/auth';
import type {
  Location,
  LocationStaffMember,
  CreateLocationDto,
  UpdateLocationDto,
  CertifyStaffDto,
  DecertifyStaffDto,
} from '@/shared/types/location';

export const fetchLocations = async (): Promise<Location[]> => {
  const { data } = await apiClient.get<ApiEnvelope<Location[]>>('/locations');
  return data.data;
};

export const fetchLocationById = async (id: string): Promise<Location> => {
  const { data } = await apiClient.get<ApiEnvelope<Location>>(`/locations/${id}`);
  return data.data;
};

export const createLocation = async (dto: CreateLocationDto): Promise<Location> => {
  const { data } = await apiClient.post<ApiEnvelope<Location>>('/locations', dto);
  return data.data;
};

export const updateLocation = async ({
  id,
  dto,
}: {
  id: string;
  dto: UpdateLocationDto;
}): Promise<Location> => {
  const { data } = await apiClient.patch<ApiEnvelope<Location>>(`/locations/${id}`, dto);
  return data.data;
};

export const deleteLocation = async (id: string): Promise<void> => {
  await apiClient.delete(`/locations/${id}`);
};

export const fetchLocationStaff = async (
  id: string,
  activeOnly = true,
): Promise<LocationStaffMember[]> => {
  const { data } = await apiClient.get<ApiEnvelope<LocationStaffMember[]>>(
    `/locations/${id}/staff`,
    { params: { activeOnly } },
  );
  return data.data;
};

export const certifyStaff = async (
  locationId: string,
  dto: CertifyStaffDto,
): Promise<LocationStaffMember> => {
  const { data } = await apiClient.post<ApiEnvelope<LocationStaffMember>>(
    `/locations/${locationId}/staff/certify`,
    dto,
  );
  return data.data;
};

export const decertifyStaff = async (
  locationId: string,
  dto: DecertifyStaffDto,
): Promise<void> => {
  await apiClient.post(`/locations/${locationId}/staff/decertify`, dto);
};
