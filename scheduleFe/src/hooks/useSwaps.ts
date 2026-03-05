import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSwaps,
  fetchSwapById,
  createSwap,
  cancelSwap,
  acceptSwap,
  approveSwap,
  denySwap,
} from '@/api/swaps';
import { ToastService } from '@/shared/services/ToastService';
import type { SwapsQueryParams, CreateSwapDto, ResolveSwapDto } from '@/shared/types/swap';

import axios from 'axios';

const errMsg = (e: unknown, fallback: string) =>
  axios.isAxiosError(e)
    ? (e.response?.data as { message?: string })?.message ?? fallback
    : fallback;

export const useSwaps = (params?: SwapsQueryParams) => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['swaps'] });

  const query = useQuery({
    queryKey: ['swaps', params],
    queryFn: () => fetchSwaps(params),
  });

  const create = useMutation({
    mutationFn: (dto: CreateSwapDto) => createSwap(dto),
    onSuccess: () => {
      invalidate();
      ToastService.success({ title: 'Request sent', message: 'Swap request created.' });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Could not create swap request.') }),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelSwap(id),
    onSuccess: () => {
      invalidate();
      ToastService.success({ title: 'Cancelled', message: 'Swap request cancelled.' });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Could not cancel.') }),
  });

  const accept = useMutation({
    mutationFn: (id: string) => acceptSwap(id),
    onSuccess: () => {
      invalidate();
      ToastService.success({ title: 'Accepted', message: 'You have accepted the swap.' });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Could not accept.') }),
  });

  const approve = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto?: ResolveSwapDto }) => approveSwap(id, dto),
    onSuccess: () => {
      invalidate();
      ToastService.success({ title: 'Approved', message: 'Swap request approved.' });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Could not approve.') }),
  });

  const deny = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto?: ResolveSwapDto }) => denySwap(id, dto),
    onSuccess: () => {
      invalidate();
      ToastService.success({ title: 'Denied', message: 'Swap request denied.' });
    },
    onError: (e) => ToastService.error({ title: 'Error', message: errMsg(e, 'Could not deny.') }),
  });

  return { ...query, create, cancel, accept, approve, deny };
};

export const useSwap = (id: string | null) =>
  useQuery({
    queryKey: ['swaps', id],
    queryFn: () => fetchSwapById(id!),
    enabled: !!id,
  });
