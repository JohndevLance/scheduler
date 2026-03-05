// Overtime summary — scheduled hours per staff for a given week
export interface StaffHours {
  userId: string;
  firstName: string;
  lastName: string;
  scheduledHours: number;
}

export type OvertimeSummaryResponse = StaffHours[];

// Overtime alerts — staff at risk of overtime (≥35 h)
export interface OvertimeAlert {
  userId: string;
  firstName: string;
  lastName: string;
  scheduledHours: number;
  upcomingShifts: number;
}

export type OvertimeAlertsResponse = OvertimeAlert[];

// Labor cost — regular vs premium hours per staff member
export interface StaffLaborCost {
  userId: string;
  firstName: string;
  lastName: string;
  regularHours: number;
  premiumHours: number;
  totalHours: number;
}

export type LaborCostResponse = StaffLaborCost[];

// Coverage — understaffed shift counts grouped by day
export interface CoverageDay {
  date: string;
  totalShifts: number;
  understaffedShifts: number;
  totalSlotsNeeded: number;
  totalAssigned: number;
}

export type CoverageResponse = CoverageDay[];

// Utilization — % fully-staffed published shifts
export interface UtilizationResponse {
  totalShifts: number;
  fullyStaffedShifts: number;
  utilizationPct: number;
}
