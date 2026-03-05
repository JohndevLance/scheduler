import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocationStaff } from '@/hooks/useLocations';
import { useUsers } from '@/hooks/useUsers';
import { MapPin, Phone, Clock, UserPlus, X } from 'lucide-react';
import type { Location } from '@/shared/types/location';

interface LocationDetailSheetProps {
  location: Location | null;
  onClose: () => void;
  canManage: boolean;
}

interface CertifyFormValues {
  userId: string;
  note: string;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3>
    {children}
  </div>
);

const LocationDetailSheet = ({ location, onClose, canManage }: LocationDetailSheetProps) => {
  const [certifyOpen, setCertifyOpen] = useState(false);
  const [decertifyTarget, setDecertifyTarget] = useState<{ userId: string; name: string } | null>(null);

  const { data: staffList, isLoading: staffLoading, certify, decertify } = useLocationStaff(
    location?.id ?? '',
  );
  const { data: usersData } = useUsers({ limit: 100 });

  const form = useForm<CertifyFormValues>({ defaultValues: { userId: '', note: '' } });

  if (!location) return null;

  const handleCertify = (values: CertifyFormValues) => {
    certify.mutate({ userId: values.userId, note: values.note || undefined }, {
      onSuccess: () => {
        setCertifyOpen(false);
        form.reset();
      },
    });
  };

  // Users not yet certified at this location
  const certifiedIds = new Set((staffList ?? []).map((s) => s.userId));
  const uncertifiedUsers = (usersData?.data ?? []).filter((u) => !certifiedIds.has(u.id));

  return (
    <>
      <Sheet open={!!location} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-base">{location.name}</SheetTitle>
            <SheetDescription className="text-sm">
              {location.city}, {location.state}
            </SheetDescription>
            <Badge
              variant={location.isActive ? 'default' : 'secondary'}
              className="w-fit mt-1"
            >
              {location.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </SheetHeader>

          <Separator className="mb-5" />

          <div className="space-y-6">
            {/* Info */}
            <Section title="Details">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                  <span>
                    {location.address}, {location.city}, {location.state} {location.zipCode}
                  </span>
                </div>
                {location.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                    <span>{location.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4 shrink-0 text-gray-400" />
                  <span>{location.timezone}</span>
                </div>
              </div>
            </Section>

            <Separator />

            {/* Staff */}
            <Section title={`Certified staff (${staffList?.length ?? 0})`}>
              {canManage && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 mb-3"
                  onClick={() => setCertifyOpen(true)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Certify staff
                </Button>
              )}

              {staffLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !staffList?.length ? (
                <p className="text-sm text-gray-400">No staff certified at this location yet.</p>
              ) : (
                <div className="space-y-2">
                  {staffList.map((s) => {
                    const initials = `${s.user.firstName.charAt(0)}${s.user.lastName.charAt(0)}`.toUpperCase();
                    return (
                      <div
                        key={s.userId}
                        className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-tight">
                              {s.user.firstName} {s.user.lastName}
                            </p>
                            <p className="text-xs text-gray-400 capitalize">{s.user.role}</p>
                          </div>
                        </div>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-destructive"
                            onClick={() =>
                              setDecertifyTarget({
                                userId: s.userId,
                                name: `${s.user.firstName} ${s.user.lastName}`,
                              })
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>
        </SheetContent>
      </Sheet>

      {/* Certify dialog */}
      <Dialog open={certifyOpen} onOpenChange={(v) => !v && setCertifyOpen(false)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Certify staff member</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCertify)} className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                rules={{ required: 'Please select a staff member' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff member</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Select staff…</option>
                        {uncertifiedUsers.map((u) => (
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
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Completed orientation on…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCertifyOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={certify.isPending}>
                  {certify.isPending ? 'Certifying…' : 'Certify'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Decertify confirm */}
      <AlertDialog
        open={!!decertifyTarget}
        onOpenChange={(v) => !v && setDecertifyTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove certification?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{decertifyTarget?.name}</strong>'s certification for{' '}
              <strong>{location.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (decertifyTarget) {
                  decertify.mutate(
                    { userId: decertifyTarget.userId },
                    { onSuccess: () => setDecertifyTarget(null) },
                  );
                }
              }}
            >
              {decertify.isPending ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LocationDetailSheet;
