import { useState } from 'react';
import { useLocations } from '@/hooks/useLocations';
import { useAuth } from '@/hooks/useAuth';
import LocationFormDialog from '@/components/locations/LocationFormDialog';
import LocationDetailSheet from '@/components/locations/LocationDetailSheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, MapPin } from 'lucide-react';
import type { Location, CreateLocationDto, UpdateLocationDto } from '@/shared/types/location';

const LocationsPage = () => {
  const { user: me } = useAuth();
  const { data: locations = [], isLoading, create, update, remove } = useLocations();

  const isAdmin = me?.role === 'admin';
  const canManage = me?.role === 'admin' || me?.role === 'manager';

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Location | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
  const [detailTarget, setDetailTarget] = useState<Location | null>(null);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading ? 'Loading…' : `${locations.length} location${locations.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add location
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Timezone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="h-8 w-8 text-gray-300" />
                    No locations found.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              locations.map((loc) => (
                <TableRow
                  key={loc.id}
                  className="cursor-pointer"
                  onClick={() => setDetailTarget(loc)}
                >
                  <TableCell className="font-medium">{loc.name}</TableCell>
                  <TableCell className="text-gray-500 max-w-[180px] truncate">
                    {loc.address}
                  </TableCell>
                  <TableCell className="text-gray-500">{loc.city}</TableCell>
                  <TableCell className="text-gray-500">{loc.state}</TableCell>
                  <TableCell className="text-gray-500 text-xs">{loc.timezone}</TableCell>
                  <TableCell>
                    <Badge variant={loc.isActive ? 'default' : 'secondary'}>
                      {loc.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailTarget(loc)}>
                            View staff
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem onClick={() => setEditTarget(loc)}>
                              Edit
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(loc)}
                              >
                                Deactivate
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create dialog */}
      <LocationFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        mode="create"
        isPending={create.isPending}
        onSubmit={(dto) => {
          create.mutate(dto as CreateLocationDto, {
            onSuccess: () => setCreateOpen(false),
          });
        }}
      />

      {/* Edit dialog */}
      {editTarget && (
        <LocationFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          mode="edit"
          location={editTarget}
          isPending={update.isPending}
          onSubmit={(dto) => {
            update.mutate(
              { id: editTarget.id, dto: dto as UpdateLocationDto },
              { onSuccess: () => setEditTarget(null) },
            );
          }}
        />
      )}

      {/* Location detail + staff sheet */}
      <LocationDetailSheet
        location={detailTarget}
        onClose={() => setDetailTarget(null)}
        canManage={canManage}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate <strong>{deleteTarget?.name}</strong>. It will no longer appear
              in schedules.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
                }
              }}
            >
              {remove.isPending ? 'Deactivating…' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LocationsPage;
