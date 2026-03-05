import type { PaginationParams } from './common';

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  timezone: string;
  phone?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationStaffMember {
  userId: string;
  locationId: string;
  certifiedAt: string;
  note?: string | null;
  isActive: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    phone?: string | null;
  };
}

export interface CreateLocationDto {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  timezone: string;
  phone?: string;
}

export interface UpdateLocationDto {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  timezone?: string;
  phone?: string;
  isActive?: boolean;
}

export interface CertifyStaffDto {
  userId: string;
  note?: string;
}

export interface DecertifyStaffDto {
  userId: string;
  reason?: string;
}

export interface LocationsQueryParams extends PaginationParams {
  search?: string;
}
