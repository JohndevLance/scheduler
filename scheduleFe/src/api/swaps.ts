import apiClient from './axiosInstance';
import type { ApiEnvelope } from '@/shared/types/auth';
import type { FlatPaginatedResponse } from '@/shared/types/common';
import type {
  SwapRequest,
  CreateSwapDto,
  ResolveSwapDto,
  SwapsQueryParams,
  EligibleCover,
} from '@/shared/types/swap';

export const fetchSwaps = async (
  params?: SwapsQueryParams,
): Promise<FlatPaginatedResponse<SwapRequest>> => {
  const { data } = await apiClient.get<ApiEnvelope<FlatPaginatedResponse<SwapRequest>>>('/swaps', {
    params,
  });
  return data.data;
};

export const fetchSwapById = async (id: string): Promise<SwapRequest> => {
  const { data } = await apiClient.get<ApiEnvelope<SwapRequest>>(`/swaps/${id}`);
  return data.data;
};

export const createSwap = async (dto: CreateSwapDto): Promise<SwapRequest> => {
  const { data } = await apiClient.post<ApiEnvelope<SwapRequest>>('/swaps', dto);
  return data.data;
};

export const cancelSwap = async (id: string): Promise<void> => {
  await apiClient.delete(`/swaps/${id}`);
};

export const acceptSwap = async (id: string): Promise<SwapRequest> => {
  const { data } = await apiClient.post<ApiEnvelope<SwapRequest>>(`/swaps/${id}/accept`);
  return data.data;
};

export const approveSwap = async (id: string, dto?: ResolveSwapDto): Promise<SwapRequest> => {
  const { data } = await apiClient.post<ApiEnvelope<SwapRequest>>(`/swaps/${id}/approve`, dto ?? {});
  return data.data;
};

export const denySwap = async (id: string, dto?: ResolveSwapDto): Promise<SwapRequest> => {
  const { data } = await apiClient.post<ApiEnvelope<SwapRequest>>(`/swaps/${id}/deny`, dto ?? {});
  return data.data;
};

export const fetchEligibleCovers = async (shiftId: string): Promise<EligibleCover[]> => {
  const { data } = await apiClient.get<ApiEnvelope<EligibleCover[]>>(`/swaps/eligible-covers/${shiftId}`);
  return data.data;
};
