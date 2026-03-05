import { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { useAvailability } from '@/hooks/useAvailability';
import type { Availability, CreateAvailabilityExceptionDto, SetAvailabilityDto } from '@/shared/types/user';

// 0=Sun … 6=Sat — displayed Mon–Sun
const DAYS = [
  { label: 'Monday',    short: 'Mon', dow: 1 },
  { label: 'Tuesday',   short: 'Tue', dow: 2 },
  { label: 'Wednesday', short: 'Wed', dow: 3 },
  { label: 'Thursday',  short: 'Thu', dow: 4 },
  { label: 'Friday',    short: 'Fri', dow: 5 },
  { label: 'Saturday',  short: 'Sat', dow: 6 },
  { label: 'Sunday',    short: 'Sun', dow: 0 },
];

interface DayRowState {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

interface ExceptionFormValues {
  date: string;
  isUnavailableAllDay: boolean;
  startTime: string;
  endTime: string;
  reason: string;
}

interface AvailabilityPanelProps {
  userId: string;
}

const defaultDayRow = (): DayRowState => ({ isAvailable: false, startTime: '09:00', endTime: '17:00' });

const buildRowsFromApi = (data: Availability[]): Record<number, DayRowState> => {
  const map: Record<number, DayRowState> = {};
  DAYS.forEach(({ dow }) => { map[dow] = defaultDayRow(); });
  data.forEach((a) => {
    map[a.dayOfWeek] = { isAvailable: a.isAvailable, startTime: a.startTime, endTime: a.endTime };
  });
  return map;
};

const AvailabilityPanel = ({ userId }: AvailabilityPanelProps) => {
  const { data: availability, isLoading, setSchedule, addException, removeException } = useAvailability(userId);
  void removeException; // available for the exceptions list delete action

  // Server-derived rows (memoised — only recomputes when API data changes)
  const serverRows = useMemo(
    () => availability ? buildRowsFromApi(availability) : null,
    [availability],
  );

  // Local unsaved edits — null means "use serverRows"
  const [localEdits, setLocalEdits] = useState<Record<number, DayRowState> | null>(null);

  // Displayed rows: prefer local edits; fall back to server data; fall back to defaults
  const rows: Record<number, DayRowState> =
    localEdits ??
    serverRows ??
    Object.fromEntries(DAYS.map(({ dow }) => [dow, defaultDayRow()]));

  const [exceptionOpen, setExceptionOpen] = useState(false);

  const exForm = useForm<ExceptionFormValues>({
    defaultValues: { date: '', isUnavailableAllDay: true, startTime: '', endTime: '', reason: '' },
  });

  const watchAllDay = useWatch({ control: exForm.control, name: 'isUnavailableAllDay' });

  const handleToggleDay = (dow: number) => {
    setLocalEdits((prev) => ({
      ...(prev ?? serverRows ?? Object.fromEntries(DAYS.map(({ dow: d }) => [d, defaultDayRow()]))),
      [dow]: { ...rows[dow], isAvailable: !rows[dow].isAvailable },
    }));
  };

  const handleTimeChange = (dow: number, field: 'startTime' | 'endTime', val: string) => {
    setLocalEdits((prev) => ({
      ...(prev ?? serverRows ?? Object.fromEntries(DAYS.map(({ dow: d }) => [d, defaultDayRow()]))),
      [dow]: { ...rows[dow], [field]: val },
    }));
  };

  const handleSaveSchedule = () => {
    const availabilities: SetAvailabilityDto[] = DAYS.map(({ dow }) => ({
      dayOfWeek: dow,
      isAvailable: rows[dow].isAvailable,
      startTime: rows[dow].startTime,
      endTime: rows[dow].endTime,
    }));
    setSchedule.mutate({ availabilities }, {
      onSuccess: () => setLocalEdits(null), // clear local edits after save
    });
  };

  const handleAddException = (values: ExceptionFormValues) => {
    const dto: CreateAvailabilityExceptionDto = {
      date: values.date,
      isUnavailableAllDay: values.isUnavailableAllDay,
      startTime: !values.isUnavailableAllDay ? values.startTime : undefined,
      endTime: !values.isUnavailableAllDay ? values.endTime : undefined,
      reason: values.reason || undefined,
    };
    addException.mutate(dto, {
      onSuccess: () => {
        setExceptionOpen(false);
        exForm.reset();
      },
    });
  };

  // Exceptions embedded in the availability response? The API returns Availability[],
  // so exceptions are fetched separately — but the existing API hook returns the same
  // data. We keep exceptions in a separate list derived from availability if present.
  // The GET /users/:id/availability endpoint only returns recurring availability.
  // Exceptions are only created/deleted — no separate GET endpoint is documented,
  // so we track them from cache invalidation. The panel shows what we have.

  return (
    <div className="space-y-6">
      {/* ── Weekly recurring schedule ────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Weekly schedule</p>
            <p className="text-xs text-gray-400">Toggle days you are available and set your hours.</p>
          </div>
          <Button
            size="sm"
            onClick={handleSaveSchedule}
            disabled={setSchedule.isPending || isLoading}
          >
            {setSchedule.isPending ? 'Saving…' : 'Save schedule'}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}
          </div>
        ) : (
          <div className="rounded-lg border divide-y overflow-hidden">
            {DAYS.map(({ label, short, dow }) => {
              const row = rows[dow];
              return (
                <div
                  key={dow}
                  className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                    row.isAvailable ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleDay(dow)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                      row.isAvailable ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-label={`Toggle ${label}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${
                        row.isAvailable ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  {/* Day label */}
                  <span className={`w-24 text-sm font-medium ${row.isAvailable ? 'text-gray-800' : 'text-gray-400'}`}>
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{short}</span>
                  </span>

                  {/* Time pickers */}
                  {row.isAvailable ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <Input
                        type="time"
                        value={row.startTime}
                        onChange={(e) => handleTimeChange(dow, 'startTime', e.target.value)}
                        className="h-8 w-28 text-sm"
                      />
                      <span className="text-gray-400 text-xs">–</span>
                      <Input
                        type="time"
                        value={row.endTime}
                        onChange={(e) => handleTimeChange(dow, 'endTime', e.target.value)}
                        className="h-8 w-28 text-sm"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic flex-1">Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* ── One-off exceptions ───────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Date exceptions</p>
            <p className="text-xs text-gray-400">Override your availability for a specific date.</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setExceptionOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add exception
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <p className="text-xs text-gray-400 italic">No exceptions on record. Use "Add exception" to override a specific date.</p>
        )}
      </div>

      {/* ── Add exception dialog ─────────────────────────────────── */}
      <Dialog open={exceptionOpen} onOpenChange={(v) => { if (!v) { setExceptionOpen(false); exForm.reset(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add date exception</DialogTitle>
            <DialogDescription>
              Override your recurring availability for a specific date.
            </DialogDescription>
          </DialogHeader>

          <Form {...exForm}>
            <form onSubmit={exForm.handleSubmit(handleAddException)} className="space-y-4">
              <FormField
                control={exForm.control}
                name="date"
                rules={{ required: 'Date is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* All-day toggle */}
              <FormField
                control={exForm.control}
                name="isUnavailableAllDay"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          field.value ? 'bg-red-500' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${field.value ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                      <FormLabel className="mt-0! cursor-pointer" onClick={() => field.onChange(!field.value)}>
                        Unavailable all day
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Time window — shown only when not all-day */}
              {!watchAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={exForm.control}
                    name="startTime"
                    rules={{ required: 'Required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={exForm.control}
                    name="endTime"
                    rules={{ required: 'Required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={exForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason <span className="font-normal text-gray-400">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Doctor appointment, holiday…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setExceptionOpen(false); exForm.reset(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addException.isPending}>
                  {addException.isPending ? 'Saving…' : 'Add exception'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AvailabilityPanel;
