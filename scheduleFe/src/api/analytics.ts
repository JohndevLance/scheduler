import apiClient from './axiosInstance';
import type { ApiEnvelope } from '@/shared/types/auth';
import type {
  OvertimeSummaryResponse,
  OvertimeAlertsResponse,
  LaborCostResponse,
  CoverageResponse,
  UtilizationResponse,
} from '@/shared/types/analytics';

export const fetchOvertimeSummary = async (
  locationId: string,
  weekStart: string,
): Promise<OvertimeSummaryResponse> => {
  const { data } = await apiClient.get<ApiEnvelope<OvertimeSummaryResponse>>(
    `/analytics/${locationId}/overtime-summary`,
    { params: { weekStart } },
  );
  return data.data;
};

export const fetchOvertimeAlerts = async (
  locationId: string,
): Promise<OvertimeAlertsResponse> => {
  const { data } = await apiClient.get<ApiEnvelope<OvertimeAlertsResponse>>(
    `/analytics/${locationId}/overtime-alerts`,
  );
  return data.data;
};

export const fetchLaborCost = async (
  locationId: string,
  startDate: string,
  endDate: string,
): Promise<LaborCostResponse> => {
  const { data } = await apiClient.get<ApiEnvelope<LaborCostResponse>>(
    `/analytics/${locationId}/labor-cost`,
    { params: { startDate, endDate } },
  );
  return data.data;
};

export const fetchCoverage = async (
  locationId: string,
  weekStart: string,
): Promise<CoverageResponse> => {
  const { data } = await apiClient.get<ApiEnvelope<CoverageResponse>>(
    `/analytics/${locationId}/coverage`,
    { params: { weekStart } },
  );
  return data.data;
};

export const fetchUtilization = async (
  locationId: string,
  weekStart: string,
): Promise<UtilizationResponse> => {
  const { data } = await apiClient.get<ApiEnvelope<UtilizationResponse>>(
    `/analytics/${locationId}/utilization`,
    { params: { weekStart } },
  );
  return data.data;
};
