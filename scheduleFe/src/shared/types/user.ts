import type { UserRole } from './auth';
import type { PaginationParams } from './common';

export interface Skill {
  id: string;
  name: string;
  description?: string;
}

export interface Availability {
  id: string;
  dayOfWeek: number; // 0=Sun, 1=Mon … 6=Sat
  startTime: string; // HH:mm
  endTime: string;
  isAvailable: boolean;
}

export interface AvailabilityException {
  id: string;
  date: string; // YYYY-MM-DD
  isUnavailableAllDay: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
  desiredHoursPerWeek?: number;
  phone?: string;
  timezone?: string;
  skillIds?: string[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
  desiredHoursPerWeek?: number;
  phone?: string;
  timezone?: string;
  skillIds?: string[];
}

export interface SetAvailabilityDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface SetAvailabilityBulkDto {
  availabilities: SetAvailabilityDto[];
}

export interface CreateAvailabilityExceptionDto {
  date: string;
  isUnavailableAllDay: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface UsersQueryParams extends PaginationParams {
  search?: string;
  role?: UserRole;
  locationId?: string;
  skillId?: string;
}
