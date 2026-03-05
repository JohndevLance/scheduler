import { useQuery } from '@tanstack/react-query';
import { fetchWeeklySchedule, fetchMyWeeklySchedule } from '@/api/schedules';
import type { Shift } from '@/shared/types/shift';

export const useWeeklySchedule = (locationId: string, weekStart: string) => {
  return useQuery({
    queryKey: ['schedule', locationId, weekStart],
    queryFn: () => fetchWeeklySchedule(locationId, weekStart),
    enabled: !!locationId && !!weekStart,
  });
};

export const useMyWeeklySchedule = (weekStart: string) => {
  return useQuery<Shift[]>({
    queryKey: ['my-schedule', weekStart],
    queryFn: () => fetchMyWeeklySchedule(weekStart),
    enabled: !!weekStart,
  });
};
