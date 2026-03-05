import type { Skill } from './user';
import type { Location } from './location';
import type { PaginationParams } from './common';

export type ShiftStatus = 'draft' | 'published' | 'cancelled';

export interface AssignedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

/** Shape returned by GET /shifts/:id — only contains userId, no user details */
export interface ShiftAssignment {
  id: string;
  userId: string;
  assignedById?: string;
  notes?: string | null;
  isSwapPending?: boolean;
  createdAt?: string;
}

export interface Shift {
  id: string;
  locationId: string;
  location?: Location;
  requiredSkillId?: string | null;
  requiredSkill?: Skill | null;
  startTime: string; // ISO 8601
  endTime: string;
  headcount: number;
  status: ShiftStatus;
  notes?: string | null;
  /** Returned by GET /shifts/:id */
  assignments?: ShiftAssignment[];
  /** Returned by some list endpoints */
  assignedUsers?: AssignedUser[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateShiftDto {
  locationId: string;
  requiredSkillId?: string;
  startTime: string;
  endTime: string;
  headcount?: number;
  notes?: string;
}

export interface UpdateShiftDto {
  requiredSkillId?: string;
  startTime?: string;
  endTime?: string;
  headcount?: number;
  status?: ShiftStatus;
  notes?: string;
}

export interface AssignStaffDto {
  userId: string;
  notes?: string;
}

// ─── Constraint violation error (returned by assign staff endpoint) ─────────
export interface ConstraintViolation {
  rule: string;
  affectedShiftId: string;
  affectedUserId: string;
  message: string;
}

export interface ConstraintSuggestion {
  userId: string;
  userName: string;
  reason: string;
}

export interface ConstraintViolationError {
  message: string;
  violations: ConstraintViolation[];
  suggestions: ConstraintSuggestion[];
}

// ─────────────────────────────────────────────────────────────────────────────

export interface ShiftsQueryParams extends PaginationParams {
  locationId?: string;
  startDate?: string;
  endDate?: string;
  status?: ShiftStatus;
  userId?: string;
  skillId?: string;
}

// Weekly schedule grouped by day
export interface DaySchedule {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  shifts: ScheduleShift[];
}

// Shift shape returned inside the weekly schedule endpoint
export interface ScheduleShift {
  id: string;
  startTime: string;
  endTime: string;
  headcount: number;
  filledCount: number;
  status: ShiftStatus;
  isPremium: boolean;
  notes?: string | null;
  assignees: AssignedUser[];
  /** IANA timezone of the shift's location, e.g. "America/New_York" */
  locationTimezone?: string | null;
}

// WeeklySchedule is just the flat array returned by /schedules/{id}/week
export type WeeklySchedule = DaySchedule[];
