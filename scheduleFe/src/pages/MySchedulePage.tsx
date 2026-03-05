import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { addDays, startOfWeek, format } from 'date-fns';
import { ChevronLeft, ChevronRight, ArrowLeftRight, Trash2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useMyWeeklySchedule } from '@/hooks/useSchedule';
import { useLocations } from '@/hooks/useLocations';
import { useSwaps } from '@/hooks/useSwaps';
import { useAuthStore } from '@/store/authStore';
import { fetchEligibleCovers } from '@/api/swaps';
import { fmtTimeInTz, utcToDatetimeLocal, tzAbbr } from '@/utils/dateTime';
import type { Shift } from '@/shared/types/shift';
import type { SwapType } from '@/shared/types/swap';

const STATUS_BADGE: Record<string, string> = {
  published: 'bg-green-100 text-green-800',
  draft: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-gray-100 text-gray-400 line-through',
};

const SWAP_STATUS_BADGE: Record<string, string> = {
  pending_acceptance: 'bg-blue-100 text-blue-700',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  expired: 'bg-gray-100 text-gray-400',
};

interface SwapFormValues {
  coverId: string;
  requesterNote: string;
}

/** Returns "YYYY-MM-DD" in the given location timezone */
const shiftLocalDate = (iso: string, tz: string) =>
  utcToDatetimeLocal(iso, tz).split('T')[0];

const MySchedulePage = () => {
  const { user } = useAuthStore();

  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [swapDialog, setSwapDialog] = useState<{ shift: Shift; type: SwapType } | null>(null);

  const weekStartIso = format(weekStart, 'yyyy-MM-dd');
  const { data: myShifts, isLoading } = useMyWeeklySchedule(weekStartIso);
  const { data: locations = [] } = useLocations();
  const { data: mySwapsData } = useSwaps({ requesterId: user?.id });
  const { create: createSwap } = useSwaps();

  // Fetch eligible covers only when a swap (not drop) dialog is open
  const { data: eligibleCovers = [], isLoading: coversLoading } = useQuery({
    queryKey: ['eligible-covers', swapDialog?.shift.id],
    queryFn: () => fetchEligibleCovers(swapDialog!.shift.id),
    enabled: !!swapDialog && swapDialog.type === 'swap',
  });

  // locationId → timezone lookup (fallback when location isn't embedded in shift)
  const locationTzMap: Record<string, string> = Object.fromEntries(
    locations.map((l) => [l.id, l.timezone]),
  );

  const getTz = (shift: Shift) =>
    shift.location?.timezone ?? locationTzMap[shift.locationId] ?? 'UTC';

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const prevWeek = () => setWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setWeekStart((d) => addDays(d, 7));

  // Group by local date in the shift's location timezone (avoids browser-TZ day mismatch)
  const getShiftsForDay = (date: Date) => {
    if (!myShifts) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    return myShifts.filter((s) => shiftLocalDate(s.startTime, getTz(s)) === dateStr);
  };

  const allMyShifts = myShifts ?? [];
  const totalHours = allMyShifts.reduce((acc, s) => {
    const diff = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3_600_000;
    return acc + diff;
  }, 0);

  // Active (non-terminal) user swap requests keyed by shiftId
  const activeSwapsByShiftId = Object.fromEntries(
    (mySwapsData?.data ?? [])
      .filter((sw) => !['approved', 'rejected', 'cancelled', 'expired'].includes(sw.status))
      .map((sw) => [sw.shiftId, sw]),
  );

  const form = useForm<SwapFormValues>({ defaultValues: { coverId: '', requesterNote: '' } });

  const handleSwapSubmit = (values: SwapFormValues) => {
    if (!swapDialog) return;
    createSwap.mutate(
      {
        shiftId: swapDialog.shift.id,
        type: swapDialog.type,
        coverId: values.coverId || undefined,
        requesterNote: values.requesterNote || undefined,
      },
      { onSuccess: () => { setSwapDialog(null); form.reset(); } },
    );
  };

  const openSwapDialog = (shift: Shift, type: SwapType) => {
    form.reset({ coverId: '', requesterNote: '' });
    setSwapDialog({ shift, type });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Schedule</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Week of {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isLoading && (
            <span className="text-sm text-gray-500">
              {allMyShifts.length} shift{allMyShifts.length !== 1 ? 's' : ''} &bull; {totalHours.toFixed(1)} hrs
            </span>
          )}
          <div className="flex items-center gap-1 border rounded-md">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={prevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm font-medium">{format(weekStart, 'MMM d')}</span>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Day list */}
      <div className="space-y-3">
        {weekDays.map((day) => {
          const dayShifts = getShiftsForDay(day);
          const today = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const dateStr = format(day, 'yyyy-MM-dd');

          return (
            <div
              key={dateStr}
              className={`rounded-xl border bg-white overflow-hidden ${today ? 'ring-2 ring-blue-200' : ''}`}
            >
              {/* Day header */}
              <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${today ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div>
                  <span className={`font-semibold ${today ? 'text-blue-600' : 'text-gray-800'}`}>
                    {format(day, 'EEEE')}
                  </span>
                  <span className="ml-2 text-sm text-gray-400">{format(day, 'MMM d')}</span>
                </div>
                {today && (
                  <Badge variant="default" className="bg-blue-600 text-white text-xs">Today</Badge>
                )}
                {dayShifts.length > 0 && (
                  <span className="ml-auto text-xs text-gray-400">
                    {dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Shifts */}
              {isLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : dayShifts.length === 0 ? (
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-400">No shifts scheduled.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {dayShifts.map((shift) => {
                    const tz = getTz(shift);
                    const durationHrs = (
                      (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 3_600_000
                    ).toFixed(1);
                    const existingSwap = activeSwapsByShiftId[shift.id];
                    const canAct = shift.status === 'published' && !existingSwap;

                    return (
                      <div key={shift.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {fmtTimeInTz(shift.startTime, tz)} – {fmtTimeInTz(shift.endTime, tz)}
                              </span>
                              <span className="text-xs text-gray-400">{durationHrs} hrs</span>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[shift.status]}`}>
                                {shift.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                              {shift.location?.name && <span>{shift.location.name}</span>}
                              <span className="text-gray-400 font-medium">{tzAbbr(tz)}</span>
                              {shift.requiredSkill?.name && (
                                <span className="text-gray-400">· {shift.requiredSkill.name}</span>
                              )}
                              {shift.notes && (
                                <span className="text-gray-400 italic">"{shift.notes}"</span>
                              )}
                            </div>

                            {existingSwap && (
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${SWAP_STATUS_BADGE[existingSwap.status]}`}>
                                {existingSwap.type === 'drop' ? 'Drop' : 'Swap'} · {existingSwap.status.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>

                          {canAct && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 text-xs"
                                onClick={() => openSwapDialog(shift, 'swap')}
                              >
                                <ArrowLeftRight className="h-3 w-3" />
                                Swap
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => openSwapDialog(shift, 'drop')}
                              >
                                <Trash2 className="h-3 w-3" />
                                Drop
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Swap / drop request dialog */}
      <Dialog
        open={!!swapDialog}
        onOpenChange={(v) => { if (!v) { setSwapDialog(null); form.reset(); } }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {swapDialog?.type === 'drop' ? 'Drop shift' : 'Request shift swap'}
            </DialogTitle>
            <DialogDescription>
              {swapDialog?.type === 'drop'
                ? 'Ask your manager to unassign you from this shift. No cover needed.'
                : 'Request another employee to cover this shift. Your manager will approve.'}
            </DialogDescription>
          </DialogHeader>

          {swapDialog && (
            <div className="rounded-md bg-gray-50 border px-3 py-2 text-sm text-gray-600">
              <span className="font-medium">
                {fmtTimeInTz(swapDialog.shift.startTime, getTz(swapDialog.shift))}
                {' – '}
                {fmtTimeInTz(swapDialog.shift.endTime, getTz(swapDialog.shift))}
              </span>
              <span className="ml-1.5 text-xs font-medium text-gray-500">{tzAbbr(getTz(swapDialog.shift))}</span>
              {swapDialog.shift.location?.name && (
                <span className="ml-2 text-gray-400">{swapDialog.shift.location.name}</span>
              )}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSwapSubmit)} className="space-y-4">
              {swapDialog?.type === 'swap' && (
                <FormField
                  control={form.control}
                  name="coverId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover person <span className="font-normal text-gray-400">(optional)</span></FormLabel>
                      {coversLoading ? (
                        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-gray-400">
                          <span>Loading eligible cover staff…</span>
                        </div>
                      ) : eligibleCovers.length === 0 ? (
                        <div className="rounded-md border px-3 py-2 text-sm text-gray-400">
                          No colleagues found for this shift.
                        </div>
                      ) : (
                        <div className="max-h-52 overflow-y-auto rounded-md border divide-y">
                          {/* Anyone available option */}
                          <button
                            type="button"
                            onClick={() => field.onChange('')}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                              field.value === '' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600'
                            }`}
                          >
                            Anyone available
                          </button>
                          {eligibleCovers.map((u) => (
                            <button
                              key={u.userId}
                              type="button"
                              onClick={() => field.onChange(u.userId)}
                              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                                field.value === u.userId
                                  ? 'bg-blue-50'
                                  : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {u.canCover ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                                )}
                                <span className={u.canCover ? 'text-gray-800 font-medium' : 'text-gray-500'}>
                                  {u.firstName} {u.lastName}
                                </span>
                                {!u.canCover && (
                                  <span className="ml-auto text-[10px] text-red-400 font-medium">has conflicts</span>
                                )}
                              </div>
                              {!u.canCover && u.violations.length > 0 && (
                                <ul className="mt-1 ml-5 space-y-0.5">
                                  {u.violations.map((v, i) => (
                                    <li key={i} className="flex items-start gap-1 text-[11px] text-yellow-700">
                                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-yellow-500" />
                                      <span>{v}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="requesterNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note <span className="font-normal text-gray-400">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Doctor's appointment, family emergency…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setSwapDialog(null); form.reset(); }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createSwap.isPending}>
                  {createSwap.isPending
                    ? 'Submitting…'
                    : swapDialog?.type === 'drop'
                    ? 'Request drop'
                    : 'Request swap'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MySchedulePage;
