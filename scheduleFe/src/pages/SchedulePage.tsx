import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, startOfWeek, format, parseISO, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeeklySchedule } from '@/hooks/useSchedule';
import { useShifts } from '@/hooks/useShifts';
import { useLocations } from '@/hooks/useLocations';
import { exportWeeklySchedule } from '@/api/schedules';
import { fetchShiftById } from '@/api/shifts';
import { useAuthStore } from '@/store/authStore';
import { ToastService } from '@/shared/services/ToastService';
import ShiftFormDialog from '@/components/shifts/ShiftFormDialog';
import ShiftDetailSheet from '@/components/shifts/ShiftDetailSheet';
import type { CreateShiftDto } from '@/shared/types/shift';

const STATUS_BADGE: Record<string, string> = {
  published: 'bg-green-100 text-green-800',
  draft: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-gray-100 text-gray-400 line-through',
};

import { fmtTimeInTz, tzAbbr } from '@/utils/dateTime';

const SchedulePage = () => {
  const { user } = useAuthStore();
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  // Week navigation
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  // Location selector
  const { data: locations = [], isLoading: locLoading } = useLocations();
  const [locationId, setLocationId] = useState<string>('');

  const activeLocationId = locationId || locations[0]?.id || '';
  const activeTz = locations.find((l) => l.id === activeLocationId)?.timezone;

  // Schedule data
  const weekStartIso = format(weekStart, 'yyyy-MM-dd');
  const { data: schedule, isLoading: schedLoading } = useWeeklySchedule(activeLocationId, weekStartIso);

  // Shifts mutations
  const { create } = useShifts();

  // Dialog / detail state
  const [createDialog, setCreateDialog] = useState<{ open: boolean; date?: string }>({ open: false });
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  // Fetch full shift detail when a card is clicked
  const { data: selectedShift = null } = useQuery({
    queryKey: ['shift', selectedShiftId],
    queryFn: () => fetchShiftById(selectedShiftId!),
    enabled: !!selectedShiftId,
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const prevWeek = () => setWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setWeekStart((d) => addDays(d, 7));

  const getShiftsForDay = (date: Date) => {
    if (!schedule) return [];
    const dayData = schedule.find((d) => isSameDay(parseISO(d.date), date));
    return dayData?.shifts ?? [];
  };

  const handleExport = async () => {
    try {
      const blob = await exportWeeklySchedule(activeLocationId, weekStartIso);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule-${weekStartIso}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      ToastService.error({ title: 'Export failed', message: 'Could not download schedule.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Schedule</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Week of {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Location picker */}
          {locLoading ? (
            <Skeleton className="h-9 w-40" />
          ) : (
            <select
              value={activeLocationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="h-9 rounded-md border border-input bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}

          {/* Week nav */}
          <div className="flex items-center gap-1 border rounded-md">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={prevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm font-medium">{format(weekStart, 'MMM d')}</span>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {canManage && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setCreateDialog({ open: true })}>
                <Plus className="h-4 w-4" />
                Add shift
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 min-h-140">
        {weekDays.map((day) => {
          const dayShifts = getShiftsForDay(day);
          const isToday = isSameDay(day, new Date());
          const dateStr = format(day, 'yyyy-MM-dd');

          return (
            <div
              key={dateStr}
              className="rounded-xl border bg-white flex flex-col overflow-hidden"
            >
              {/* Day header */}
              <div className={`flex flex-col items-center py-2 border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {format(day, 'EEE')}
                </span>
                <span className={`text-lg font-semibold leading-tight ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                  {format(day, 'd')}
                </span>
              </div>

              {/* Shift cards */}
              <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
                {schedLoading ? (
                  <>
                    <Skeleton className="h-14 w-full rounded-md" />
                    <Skeleton className="h-14 w-full rounded-md" />
                  </>
                ) : dayShifts.length === 0 ? (
                  <p className="mt-2 text-center text-xs text-gray-300">—</p>
                ) : (
                  dayShifts.map((shift) => {
                    const filled = shift.filledCount ?? 0;
                    return (
                      <button
                        key={shift.id}
                        onClick={() => setSelectedShiftId(shift.id)}
                        className="w-full text-left rounded-md px-2 py-1.5 text-xs bg-white border hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-medium leading-tight">
                            {fmtTimeInTz(shift.startTime, activeTz)}
                          </span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${STATUS_BADGE[shift.status]}`}>
                            {shift.status}
                          </span>
                        </div>
                        <span className="text-gray-500">{fmtTimeInTz(shift.endTime, activeTz)}</span>
                        <div className="mt-1 flex items-center gap-1 text-gray-500">
                          <span>{filled}/{shift.headcount}</span>
                          {activeTz && (
                            <span className="ml-auto text-[10px] text-gray-400 font-medium">{tzAbbr(activeTz)}</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Add shift shortcut for admins/managers */}
              {canManage && (
                <button
                  onClick={() => setCreateDialog({ open: true, date: dateStr })}
                  className="flex items-center justify-center gap-1 border-t py-1 text-xs text-gray-400 hover:bg-gray-50 hover:text-blue-500 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Create dialog */}
      <ShiftFormDialog
        open={createDialog.open}
        onClose={() => setCreateDialog({ open: false })}
        mode="create"
        defaultLocationId={activeLocationId}
        defaultDate={createDialog.date}
        isPending={create.isPending}
        onSubmit={(dto) =>
          create.mutate(dto as CreateShiftDto, {
            onSuccess: () => setCreateDialog({ open: false }),
          })
        }
      />

      {/* Detail sheet */}
      <ShiftDetailSheet
        shift={selectedShift}
        onClose={() => setSelectedShiftId(null)}
        canManage={canManage}
      />
    </div>
  );
};

export default SchedulePage;
