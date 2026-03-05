import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocations } from '@/hooks/useLocations';
import { useSkills } from '@/hooks/useSkills';
import { utcToDatetimeLocal, datetimeLocalToUTC } from '@/utils/dateTime';
import type { Shift, CreateShiftDto, UpdateShiftDto } from '@/shared/types/shift';

type Mode = 'create' | 'edit';

interface ShiftFormValues {
  locationId: string;
  requiredSkillId: string;
  startTime: string;
  endTime: string;
  headcount: number;
  notes: string;
}

interface ShiftFormDialogProps {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  shift?: Shift;
  defaultLocationId?: string;
  defaultDate?: string; // YYYY-MM-DD
  onSubmit: (dto: CreateShiftDto | UpdateShiftDto) => void;
  isPending: boolean;
}

const ShiftFormDialog = ({
  open, onClose, mode, shift, defaultLocationId, defaultDate, onSubmit, isPending,
}: ShiftFormDialogProps) => {
  const defaultStart = defaultDate ? `${defaultDate}T09:00` : '';
  const defaultEnd = defaultDate ? `${defaultDate}T17:00` : '';

  const form = useForm<ShiftFormValues>({
    defaultValues: {
      locationId: defaultLocationId ?? '',
      requiredSkillId: '',
      startTime: defaultStart,
      endTime: defaultEnd,
      headcount: 1,
      notes: '',
    },
  });

  const { data: locations = [] } = useLocations();
  const { data: skills = [] } = useSkills();

  // Track whether the dialog was just opened so we only reset the form
  // on open — not on every re-render triggered by a shift prop reference change
  // (e.g. React Query background refetch while user is editing).
  const wasOpenRef = useRef(false);
  // Derive the timezone of the currently selected (or shift's) location.
  // For edit mode, prefer the timezone already embedded in the shift's location
  // relation; fall back to looking it up from the locations list.
  const watchedLocationId = form.watch('locationId');
  const activeLocationId = mode === 'edit' ? (shift?.locationId ?? watchedLocationId) : watchedLocationId;
  const locationTz =
    (shift as (Shift & { location?: { timezone?: string } }) | undefined)?.location?.timezone ??
    locations.find((l) => l.id === activeLocationId)?.timezone ??
    'UTC';

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    // Only reset when dialog transitions from closed → open
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;

    if (mode === 'edit' && shift) {
      // Use the timezone embedded in the shift's location for display in the form
      const shiftTz =
        (shift as Shift & { location?: { timezone?: string } })?.location?.timezone ??
        locations.find((l) => l.id === shift.locationId)?.timezone ??
        'UTC';
      form.reset({
        locationId: shift.locationId,
        requiredSkillId: shift.requiredSkillId ?? '',
        startTime: utcToDatetimeLocal(shift.startTime, shiftTz),
        endTime: utcToDatetimeLocal(shift.endTime, shiftTz),
        headcount: shift.headcount,
        notes: shift.notes ?? '',
      });
    } else {
      form.reset({
        locationId: defaultLocationId ?? '',
        requiredSkillId: '',
        startTime: defaultStart,
        endTime: defaultEnd,
        headcount: 1,
        notes: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (values: ShiftFormValues) => {
    if (mode === 'create') {
      const dto: CreateShiftDto = {
        locationId: values.locationId,
        startTime: datetimeLocalToUTC(values.startTime, locationTz),
        endTime: datetimeLocalToUTC(values.endTime, locationTz),
        headcount: values.headcount,
        requiredSkillId: values.requiredSkillId || undefined,
        notes: values.notes || undefined,
      };
      onSubmit(dto);
    } else {
      const dto: UpdateShiftDto = {
        startTime: datetimeLocalToUTC(values.startTime, locationTz),
        endTime: datetimeLocalToUTC(values.endTime, locationTz),
        headcount: values.headcount,
        requiredSkillId: values.requiredSkillId || undefined,
        notes: values.notes || undefined,
      };
      onSubmit(dto);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Shift' : 'Edit Shift'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {mode === 'create' && (
              <FormField
                control={form.control}
                name="locationId"
                rules={{ required: 'Location is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Select location…</option>
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startTime"
                rules={{ required: 'Start time is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                rules={{ required: 'End time is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {locationTz !== 'UTC' && (
              <p className="-mt-2 text-xs text-muted-foreground">
                Times are in <span className="font-medium">{locationTz}</span>
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="headcount"
                rules={{ required: 'Required', min: { value: 1, message: 'Min 1' } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headcount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? '' : Number(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requiredSkillId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required skill</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Any skill</option>
                        {skills.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Busy Friday dinner service…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : mode === 'create' ? 'Create shift' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftFormDialog;
