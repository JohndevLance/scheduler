import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { User } from '@/shared/types/auth';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  manager: 'secondary',
  staff: 'outline',
};

// Strip seconds from "08:00:00" → "08:00"
const fmtTime = (t: string) => t.slice(0, 5);

interface UserDetailSheetProps {
  user: User | null;
  onClose: () => void;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">
      {value ?? <span className="text-gray-400 font-normal">—</span>}
    </span>
  </div>
);

const UserDetailSheet = ({ user, onClose }: UserDetailSheetProps) => {
  if (!user) return null;

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const availabilities = user.availabilities ?? [];
  const exceptions = user.availabilityExceptions ?? [];
  const skills = user.skills ?? [];

  // Group availability by day sorted Mon–Sun
  const sortedAvail = [...availabilities].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <Sheet open={!!user} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
        <SheetHeader className="pb-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-base">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-base leading-tight">
                {user.firstName} {user.lastName}
              </SheetTitle>
              <SheetDescription className="text-sm">{user.email}</SheetDescription>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Badge variant={ROLE_VARIANT[user.role]} className="capitalize">
              {user.role}
            </Badge>
            <Badge variant={user.isActive ? 'default' : 'secondary'}>
              {user.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </SheetHeader>

        <Separator className="mb-5" />

        <div className="space-y-6">
          {/* Basic info */}
          <Section title="Details">
            <div className="space-y-2">
              <Field label="Phone" value={user.phone} />
              <Field label="Timezone" value={user.timezone} />
              <Field label="Desired hrs / week" value={user.desiredHoursPerWeek} />
              {user.createdAt && (
                <Field
                  label="Member since"
                  value={new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                />
              )}
            </div>
          </Section>

          <Separator />

          {/* Skills */}
          <Section title={`Skills (${skills.length})`}>
            {skills.length === 0 ? (
              <p className="text-sm text-gray-400">No skills assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <Badge key={s.id} variant="outline" title={s.description}>
                    {s.name}
                  </Badge>
                ))}
              </div>
            )}
          </Section>

          <Separator />

          {/* Weekly availability */}
          <Section title={`Weekly availability (${sortedAvail.length} days)`}>
            {sortedAvail.length === 0 ? (
              <p className="text-sm text-gray-400">No recurring availability set.</p>
            ) : (
              <div className="space-y-1.5">
                {sortedAvail.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium w-8">{DAYS[a.dayOfWeek]}</span>
                    {a.isAvailable ? (
                      <span className="text-gray-600">
                        {fmtTime(a.startTime)} – {fmtTime(a.endTime)}
                      </span>
                    ) : (
                      <Badge variant="secondary">Unavailable</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Availability exceptions */}
          {exceptions.length > 0 && (
            <>
              <Separator />
              <Section title={`Exceptions (${exceptions.length})`}>
                <div className="space-y-1.5">
                  {exceptions.map((ex) => (
                    <div
                      key={ex.id}
                      className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{ex.date}</span>
                        {ex.isUnavailableAllDay ? (
                          <Badge variant="secondary">All day</Badge>
                        ) : (
                          <span className="text-gray-600">
                            {ex.startTime && fmtTime(ex.startTime)}
                            {ex.endTime && ` – ${fmtTime(ex.endTime)}`}
                          </span>
                        )}
                      </div>
                      {ex.reason && (
                        <p className="mt-0.5 text-xs text-gray-500">{ex.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserDetailSheet;
