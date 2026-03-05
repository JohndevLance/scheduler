import { useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowLeftRight,
  ChevronDown,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSwaps } from '@/hooks/useSwaps';
import { useAuthStore } from '@/store/authStore';
import type { SwapRequest, SwapStatus } from '@/shared/types/swap';

const STATUS_BADGE: Record<SwapStatus, string> = {
  pending_acceptance: 'bg-blue-100 text-blue-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
  expired: 'bg-gray-100 text-gray-400',
};

const STATUS_LABEL: Record<SwapStatus, string> = {
  pending_acceptance: 'Pending acceptance',
  pending_approval: 'Pending approval',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const fmtDt = (iso: string) =>
  format(new Date(iso), 'EEE MMM d, h:mm a');

type FilterStatus = SwapStatus | 'all';

const SwapsPage = () => {
  const { user } = useAuthStore();
  const isManager = user?.role === 'admin' || user?.role === 'manager';

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [confirmAction, setConfirmAction] = useState<{
    type: 'cancel' | 'accept' | 'approve' | 'deny';
    swap: SwapRequest;
  } | null>(null);

  const { data, isLoading, cancel, accept, approve, deny } = useSwaps(
    statusFilter !== 'all' ? { status: statusFilter } : undefined,
  );

  const swaps = data?.data ?? [];

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, swap } = confirmAction;
    if (type === 'cancel') cancel.mutate(swap.id);
    if (type === 'accept') accept.mutate(swap.id);
    if (type === 'approve') approve.mutate({ id: swap.id });
    if (type === 'deny') deny.mutate({ id: swap.id });
    setConfirmAction(null);
  };

  const filterOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'pending_acceptance', label: 'Pending acceptance' },
    { value: 'pending_approval', label: 'Pending approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Swap Requests</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isManager ? 'Manage all swap and drop requests' : 'Your swap and drop requests'}
          </p>
        </div>

        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              {filterOptions.find((o) => o.value === statusFilter)?.label ?? 'All statuses'}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {filterOptions.map((o) => (
              <DropdownMenuItem key={o.value} onSelect={() => setStatusFilter(o.value)}>
                {o.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : swaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16 text-center">
            <ArrowLeftRight className="mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No swap requests found</p>
            <p className="mt-1 text-xs text-gray-400">
              {statusFilter !== 'all' ? 'Try changing the filter.' : 'Nothing here yet.'}
            </p>
          </div>
        ) : (
          swaps.map((swap) => {
            const isOwn = swap.requesterId === user?.id;
            const isCover = swap.coverId === user?.id;
            const canCancel = isOwn && ['pending_acceptance', 'pending_approval'].includes(swap.status);
            const canAccept = isCover && swap.status === 'pending_acceptance';
            const canResolve = isManager && swap.status === 'pending_approval';

            return (
              <div key={swap.id} className="rounded-xl border bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Info */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize">
                        {swap.type}
                      </Badge>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[swap.status]}`}
                      >
                        {STATUS_LABEL[swap.status]}
                      </span>
                    </div>

                    {swap.shift && (
                      <p className="text-sm font-medium text-gray-900">
                        {fmtDt(swap.shift.startTime)} – {format(new Date(swap.shift.endTime), 'h:mm a')}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                      {swap.requester && (
                        <span>
                          Requested by{' '}
                          <span className="font-medium text-gray-700">
                            {swap.requester.firstName} {swap.requester.lastName}
                          </span>
                        </span>
                      )}
                      {swap.cover && (
                        <span>
                          Cover:{' '}
                          <span className="font-medium text-gray-700">
                            {swap.cover.firstName} {swap.cover.lastName}
                          </span>
                        </span>
                      )}
                    </div>

                    {swap.requesterNote && (
                      <p className="text-xs text-gray-400 italic">"{swap.requesterNote}"</p>
                    )}
                    {swap.managerNote && (
                      <p className="text-xs text-gray-400 italic">Manager: "{swap.managerNote}"</p>
                    )}
                    <p className="text-[11px] text-gray-400">
                      {format(new Date(swap.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {canAccept && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
                        onClick={() => setConfirmAction({ type: 'accept', swap })}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Accept
                      </Button>
                    )}
                    {canResolve && (
                      <>
                        <Button
                          size="sm"
                          className="gap-1.5 bg-green-600 hover:bg-green-700"
                          onClick={() => setConfirmAction({ type: 'approve', swap })}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setConfirmAction({ type: 'deny', swap })}
                        >
                          <X className="h-3.5 w-3.5" />
                          Deny
                        </Button>
                      </>
                    )}
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-gray-500 hover:text-red-600"
                        onClick={() => setConfirmAction({ type: 'cancel', swap })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination info */}
      {data && data.total > 0 && (
        <>
          <Separator />
          <p className="text-center text-xs text-gray-400">
            Showing {swaps.length} of {data.total} requests
          </p>
        </>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'cancel' && 'Cancel request?'}
              {confirmAction?.type === 'accept' && 'Accept swap?'}
              {confirmAction?.type === 'approve' && 'Approve swap?'}
              {confirmAction?.type === 'deny' && 'Deny swap?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'cancel' && 'This will cancel your swap request.'}
              {confirmAction?.type === 'accept' && 'You will be covering this shift.'}
              {confirmAction?.type === 'approve' && 'The shift assignment will be transferred.'}
              {confirmAction?.type === 'deny' && 'The requester will be notified.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SwapsPage;
