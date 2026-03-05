import type { PaginationParams } from './common';

export type SwapStatus =
  | 'pending_acceptance'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export type SwapType = 'swap' | 'drop';

export interface SwapUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface SwapShift {
  id: string;
  startTime: string;
  endTime: string;
  locationId: string;
  locationName?: string;
}

export interface SwapRequest {
  id: string;
  shiftId: string;
  shift?: SwapShift;
  requesterId: string;
  requester?: SwapUser;
  coverId?: string | null;
  cover?: SwapUser | null;
  type: SwapType;
  status: SwapStatus;
  requesterNote?: string | null;
  managerNote?: string | null;
  resolvedById?: string | null;
  resolvedBy?: SwapUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSwapDto {
  shiftId: string;
  type: SwapType;
  coverId?: string;
  requesterNote?: string;
}

export interface ResolveSwapDto {
  managerNote?: string;
}

export interface EligibleCover {
  userId: string;
  firstName: string;
  lastName: string;
  canCover: boolean;
  violations: string[];
}

export interface SwapsQueryParams extends PaginationParams {
  status?: SwapStatus;
  type?: SwapType;
  requesterId?: string;
  locationId?: string;
}
