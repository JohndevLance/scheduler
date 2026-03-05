import { useQuery } from '@tanstack/react-query';
import {
  fetchOvertimeSummary,
  fetchOvertimeAlerts,
  fetchLaborCost,
  fetchCoverage,
  fetchUtilization,
} from '@/api/analytics';

export const useOvertimeSummary = (locationId: string, weekStart: string) =>
  useQuery({
    queryKey: ['analytics', 'overtime-summary', locationId, weekStart],
    queryFn: () => fetchOvertimeSummary(locationId, weekStart),
    enabled: !!locationId && !!weekStart,
  });

export const useOvertimeAlerts = (locationId: string) =>
  useQuery({
    queryKey: ['analytics', 'overtime-alerts', locationId],
    queryFn: () => fetchOvertimeAlerts(locationId),
    enabled: !!locationId,
  });

export const useLaborCost = (locationId: string, startDate: string, endDate: string) =>
  useQuery({
    queryKey: ['analytics', 'labor-cost', locationId, startDate, endDate],
    queryFn: () => fetchLaborCost(locationId, startDate, endDate),
    enabled: !!locationId && !!startDate && !!endDate,
  });

export const useCoverage = (locationId: string, weekStart: string) =>
  useQuery({
    queryKey: ['analytics', 'coverage', locationId, weekStart],
    queryFn: () => fetchCoverage(locationId, weekStart),
    enabled: !!locationId && !!weekStart,
  });

export const useUtilization = (locationId: string, weekStart: string) =>
  useQuery({
    queryKey: ['analytics', 'utilization', locationId, weekStart],
    queryFn: () => fetchUtilization(locationId, weekStart),
    enabled: !!locationId && !!weekStart,
  });
