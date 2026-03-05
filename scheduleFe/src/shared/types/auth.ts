export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  timezone?: string;
  desiredHoursPerWeek?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  skills?: import('./user').Skill[];
  availabilities?: import('./user').Availability[];
  availabilityExceptions?: import('./user').AvailabilityException[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface ApiEnvelope<T> {
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface RefreshTokenDto {
  refreshToken: string;
}
