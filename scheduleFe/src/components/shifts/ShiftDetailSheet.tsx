import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { fmtTimeInTz, fmtDateTimeInTz } from '@/utils/dateTime';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useShifts } from '@/hooks/useShifts';
import { useUsers } from '@/hooks/useUsers';
import {
  Clock, MapPin, Users, Wrench, FileText, UserPlus, X, Send, EyeOff, Pencil, Trash2, AlertTriangle,
} from 'lucide-react';
import type { Shift, ConstraintViolationError } from '@/shared/types/shift';
import ShiftFormDialog from './ShiftFormDialog';

interface ShiftDetailSheetProps {
  shift: Shift | null;
  onClose: () => void;
  canManage: boolean;
}

interface AssignFormValues {
  userId: string;
  notes: string;
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  published: 'default',
  draft: 'secondary',
  cancelled: 'outline',
};

// These component-level wrappers are kept so call-sites don't need to change;
// the timezone is threaded in at render time via the shift's location.
const fmtDateTime = (iso: string, tz?: string | null) => fmtDateTimeInTz(iso, tz);
const fmtTime = (iso: string, tz?: string | null) => fmtTimeInTz(iso, tz);

const ShiftDetailSheet = ({ shift, onClose, canManage }: ShiftDetailSheetProps) => {
  const { publish, unpublish, assign, unassign, remove, update } = useShifts();
  const { data: usersData } = useUsers({ limit: 100 });

  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState<{ userId: string; name: string } | null>(null);
  const [constraintError, setConstraintError] = useState<ConstraintViolationError | null>(null);
  const [pendingAssign, setPendingAssign] = useState<AssignFormValues | null>(null);

  const form = useForm<AssignFormValues>({ defaultValues: { userId: '', notes: '' } });

  if (!shift) return null;

  // Support both field names: assignments (GET /shifts/:id) and assignedUsers (list endpoints)
  const assignedUserIds = new Set(
    (shift.assignments ?? []).map((a) => a.userId)
      .concat((shift.assignedUsers ?? []).map((u) => u.id))
  );
  const availableUsers = (usersData?.data ?? []).filter((u) => !assignedUserIds.has(u.id));
  const filled = shift.assignments?.length ?? shift.assignedUsers?.length ?? 0;
  const isPublished = shift.status === 'published';
  const tz = shift.location?.timezone;

  const handleAssign = (values: AssignFormValues, override = false) => {
    assign.mutate(
      { shiftId: shift.id, dto: { userId: values.userId, notes: values.notes || undefined }, override },
      {
        onSuccess: () => {
          setAssignOpen(false);
          setConstraintError(null);
          setPendingAssign(null);
          form.reset();
        },
        onError: (e) => {
          if (axios.isAxiosError(e)) {
            const body = e.response?.data as Record<string, unknown>;
            if (Array.isArray(body?.violations)) {
              setAssignOpen(false);
              setPendingAssign(values);
              setConstraintError(body as unknown as ConstraintViolationError);
              return;
            }
          }
        },
      },
    );
  };

  return (
    <>
      <Sheet open={!!shift} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
          <SheetHeader className="pb-3">
            <div className="flex items-start justify-between gap-2 pr-6">
              <div>
                <SheetTitle className="text-base">
                  {fmtTime(shift.startTime, tz)} – {fmtTime(shift.endTime, tz)}
                </SheetTitle>
                <SheetDescription>{fmtDateTime(shift.startTime, tz)}</SheetDescription>
              </div>
              <Badge variant={STATUS_VARIANT[shift.status]} className="capitalize shrink-0">
                {shift.status}
              </Badge>
            </div>
          </SheetHeader>

          <Separator className="mb-4" />

          {/* Details */}
          <div className="space-y-3 text-sm mb-5">
            {shift.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                {shift.location.name}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4 text-gray-400 shrink-0" />
              {fmtDateTime(shift.startTime, tz)} → {fmtTime(shift.endTime, tz)}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4 text-gray-400 shrink-0" />
              {filled} / {shift.headcount} filled
            </div>
            {shift.requiredSkill && (
              <div className="flex items-center gap-2 text-gray-600">
                <Wrench className="h-4 w-4 text-gray-400 shrink-0" />
                {shift.requiredSkill.name}
              </div>
            )}
            {shift.notes && (
              <div className="flex items-start gap-2 text-gray-600">
                <FileText className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                {shift.notes}
              </div>
            )}
          </div>

          {/* Actions */}
          {canManage && (
            <>
              <div className="flex flex-wrap gap-2 mb-5">
                {isPublished ? (
                  <Button
                    size="sm" variant="outline"
                    className="gap-1.5"
                    disabled={unpublish.isPending}
                    onClick={() => unpublish.mutate(shift.id)}
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    Unpublish
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={publish.isPending}
                    onClick={() => publish.mutate(shift.id)}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Publish
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
              <Separator className="mb-4" />
            </>
          )}

          {/* Assigned staff */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Assigned staff ({filled}/{shift.headcount})
              </h3>
              {canManage && filled < shift.headcount && (
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setAssignOpen(true)}>
                  <UserPlus className="h-3 w-3" />
                  Assign
                </Button>
              )}
            </div>

            {!filled ? (
              <p className="text-sm text-gray-400">No staff assigned yet.</p>
            ) : (
              <div className="space-y-1.5">
                {/* Render from assignments (detail view) or assignedUsers (list view) */}
                {(shift.assignments ?? []).map((assignment) => {
                  const u = usersData?.data?.find((user) => user.id === assignment.userId);
                  const displayName = u ? `${u.firstName} ${u.lastName}` : assignment.userId;
                  const initials = u
                    ? `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase()
                    : '?';
                  return (
                    <div key={assignment.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-tight">{displayName}</p>
                          {u && <p className="text-xs text-gray-400 capitalize">{u.role}</p>}
                          {assignment.notes && <p className="text-xs text-gray-400 italic">{assignment.notes}</p>}
                        </div>
                      </div>
                      {canManage && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-destructive"
                          onClick={() => setUnassignTarget({ userId: assignment.userId, name: displayName })}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Assign dialog */}
      <Dialog open={assignOpen} onOpenChange={(v) => !v && setAssignOpen(false)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader><DialogTitle>Assign staff</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => handleAssign(values))} className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                rules={{ required: 'Select a staff member' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff member</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Select staff…</option>
                        {availableUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} ({u.role})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl><Input placeholder="Covering for Alex…" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={assign.isPending}>
                  {assign.isPending ? 'Assigning…' : 'Assign'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit shift */}
      <ShiftFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        shift={shift}
        isPending={update.isPending}
        onSubmit={(dto) => update.mutate({ id: shift.id, dto }, { onSuccess: () => setEditOpen(false) })}
      />

      {/* Unassign confirm */}
      <AlertDialog open={!!unassignTarget} onOpenChange={(v) => !v && setUnassignTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{unassignTarget?.name}</strong> from this shift?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (unassignTarget) {
                  unassign.mutate(
                    { shiftId: shift.id, userId: unassignTarget.userId },
                    { onSuccess: () => setUnassignTarget(null) },
                  );
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Constraint violation dialog */}
      <Dialog open={!!constraintError} onOpenChange={(v) => { if (!v) { setConstraintError(null); setPendingAssign(null); } }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Assignment violates constraints
            </DialogTitle>
            <DialogDescription>
              The following rule violations were detected. You can cancel, fix the issues, or override and assign anyway.
            </DialogDescription>
          </DialogHeader>

          {constraintError && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {constraintError.violations.map((v, i) => (
                <div key={i} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p className="font-medium text-amber-800 mb-0.5">
                    {v.rule.replace(/_/g, ' ')}
                  </p>
                  <p className="text-amber-700">{v.message}</p>
                </div>
              ))}
              {constraintError.suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Suggestions</p>
                  <div className="space-y-1.5">
                    {constraintError.suggestions.map((s, i) => (
                      <div key={i} className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2 text-sm text-blue-700">
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setConstraintError(null); setPendingAssign(null); setAssignOpen(true); }}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              disabled={assign.isPending}
              onClick={() => pendingAssign && handleAssign(pendingAssign, true)}
            >
              {assign.isPending ? 'Assigning…' : 'Assign anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={(v) => !v && setDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete shift?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => remove.mutate(shift.id, { onSuccess: () => { setDeleteOpen(false); onClose(); } })}
            >
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ShiftDetailSheet;
