import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from '../shifts/entities/shift.entity';
import { ShiftAssignment } from '../shifts/entities/shift-assignment.entity';
import { User } from '../users/entities/user.entity';
import { ShiftStatus } from '../../common/enums/shift-status.enum';
import { addDays, getWeekStartMonday } from '../../common/utils/date.utils';

export interface OvertimeSummaryRow {
  userId: string;
  firstName: string;
  lastName: string;
  scheduledHours: number;
  isAbove40: boolean;
}

export interface OvertimeAlertRow extends OvertimeSummaryRow {
  upcomingShifts: number;
}

export interface LaborCostRow {
  userId: string;
  firstName: string;
  lastName: string;
  regularHours: number;
  premiumHours: number;
  totalHours: number;
  shiftsWorked: number;
}

export interface CoverageReportRow {
  date: string;
  totalShifts: number;
  understaffedShifts: number;
  totalSlotsNeeded: number;
  totalAssigned: number;
}

export interface UtilizationRow {
  totalShifts: number;
  fullyStaffedShifts: number;
  utilizationPct: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,
    @InjectRepository(ShiftAssignment)
    private readonly assignmentRepo: Repository<ShiftAssignment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** Total scheduled hours per staff member for a given week. */
  async getOvertimeSummary(
    locationId: string,
    weekStart: Date,
  ): Promise<OvertimeSummaryRow[]> {
    const weekEnd = addDays(weekStart, 7);

    const rows = await this.assignmentRepo
      .createQueryBuilder('a')
      .innerJoin('a.shift', 's')
      .innerJoin('a.user', 'u')
      .where('s.locationId = :locationId', { locationId })
      .andWhere('s.status = :status', { status: ShiftStatus.PUBLISHED })
      .andWhere('s.startTime >= :weekStart', { weekStart })
      .andWhere('s.startTime < :weekEnd', { weekEnd })
      .select('u.id', 'userId')
      .addSelect('u.firstName', 'firstName')
      .addSelect('u.lastName', 'lastName')
      .addSelect(
        `SUM(EXTRACT(EPOCH FROM (s."endTime" - s."startTime")) / 3600)`,
        'scheduledHours',
      )
      .groupBy('u.id')
      .addGroupBy('u.firstName')
      .addGroupBy('u.lastName')
      .getRawMany();

    return rows.map((r) => ({
      userId: r.userId,
      firstName: r.firstName,
      lastName: r.lastName,
      scheduledHours: parseFloat(r.scheduledHours) || 0,
      isAbove40: parseFloat(r.scheduledHours) > 40,
    }));
  }

  /** Staff members with ≥35 hours already scheduled plus upcoming unpublished shifts. */
  async getOvertimeAlerts(locationId: string): Promise<OvertimeAlertRow[]> {
    const now = new Date();
    const weekStart = getWeekStartMonday(now);
    const weekEnd = addDays(weekStart, 7);

    const rows = await this.assignmentRepo
      .createQueryBuilder('a')
      .innerJoin('a.shift', 's')
      .innerJoin('a.user', 'u')
      .where('s.locationId = :locationId', { locationId })
      .andWhere('s.startTime >= :weekStart', { weekStart })
      .andWhere('s.startTime < :weekEnd', { weekEnd })
      .select('u.id', 'userId')
      .addSelect('u.firstName', 'firstName')
      .addSelect('u.lastName', 'lastName')
      .addSelect(
        `SUM(EXTRACT(EPOCH FROM (s."endTime" - s."startTime")) / 3600)`,
        'scheduledHours',
      )
      .addSelect(
        `COUNT(s.id) FILTER (WHERE s."startTime" > NOW())`,
        'upcomingShifts',
      )
      .groupBy('u.id')
      .addGroupBy('u.firstName')
      .addGroupBy('u.lastName')
      .having(
        `SUM(EXTRACT(EPOCH FROM (s."endTime" - s."startTime")) / 3600) >= 35`,
      )
      .getRawMany();

    return rows.map((r) => ({
      userId: r.userId,
      firstName: r.firstName,
      lastName: r.lastName,
      scheduledHours: parseFloat(r.scheduledHours) || 0,
      isAbove40: parseFloat(r.scheduledHours) > 40,
      upcomingShifts: parseInt(r.upcomingShifts, 10) || 0,
    }));
  }

  /** Total regular vs premium hours per staff member for a date range. */
  async getLaborCostReport(
    locationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<LaborCostRow[]> {
    const rows = await this.assignmentRepo
      .createQueryBuilder('a')
      .innerJoin('a.shift', 's')
      .innerJoin('a.user', 'u')
      .where('s.locationId = :locationId', { locationId })
      .andWhere('s.status = :status', { status: ShiftStatus.PUBLISHED })
      .andWhere('s.startTime >= :startDate', { startDate })
      .andWhere('s.startTime <= :endDate', { endDate })
      .select('u.id', 'userId')
      .addSelect('u.firstName', 'firstName')
      .addSelect('u.lastName', 'lastName')
      .addSelect(
        `SUM(CASE WHEN s."isPremium" THEN EXTRACT(EPOCH FROM (s."endTime" - s."startTime")) / 3600 ELSE 0 END)`,
        'premiumHours',
      )
      .addSelect(
        `SUM(CASE WHEN NOT s."isPremium" THEN EXTRACT(EPOCH FROM (s."endTime" - s."startTime")) / 3600 ELSE 0 END)`,
        'regularHours',
      )
      .addSelect(`COUNT(DISTINCT s.id)`, 'shiftsWorked')
      .groupBy('u.id')
      .addGroupBy('u.firstName')
      .addGroupBy('u.lastName')
      .orderBy('u.lastName')
      .getRawMany();

    return rows.map((r) => {
      const regular = parseFloat(r.regularHours) || 0;
      const premium = parseFloat(r.premiumHours) || 0;
      return {
        userId: r.userId,
        firstName: r.firstName,
        lastName: r.lastName,
        regularHours: regular,
        premiumHours: premium,
        totalHours: regular + premium,
        shiftsWorked: parseInt(r.shiftsWorked, 10) || 0,
      };
    });
  }

  /** Count understaffed shifts (assigned < requiredHeadcount) grouped by day. */
  async getCoverageReport(
    locationId: string,
    weekStart: Date,
  ): Promise<CoverageReportRow[]> {
    const weekEnd = addDays(weekStart, 7);

    const shifts = await this.shiftRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.assignments', 'a')
      .where('s.locationId = :locationId', { locationId })
      .andWhere('s.status = :status', { status: ShiftStatus.PUBLISHED })
      .andWhere('s.startTime >= :weekStart', { weekStart })
      .andWhere('s.startTime < :weekEnd', { weekEnd })
      .getMany();

    const byDay = new Map<string, CoverageReportRow>();

    for (const shift of shifts) {
      const dateKey = shift.startTime.toISOString().substring(0, 10);
      if (!byDay.has(dateKey)) {
        byDay.set(dateKey, {
          date: dateKey,
          totalShifts: 0,
          understaffedShifts: 0,
          totalSlotsNeeded: 0,
          totalAssigned: 0,
        });
      }
      const row = byDay.get(dateKey)!;
      const assigned = (shift.assignments ?? []).length;
      row.totalShifts += 1;
      row.totalSlotsNeeded += shift.headcount;
      row.totalAssigned += assigned;
      if (assigned < shift.headcount) row.understaffedShifts += 1;
    }

    return Array.from(byDay.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  /** Percentage of published shifts that are fully staffed for the week. */
  async getUtilizationReport(
    locationId: string,
    weekStart: Date,
  ): Promise<UtilizationRow> {
    const weekEnd = addDays(weekStart, 7);

    const shifts = await this.shiftRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.assignments', 'a')
      .where('s.locationId = :locationId', { locationId })
      .andWhere('s.status = :status', { status: ShiftStatus.PUBLISHED })
      .andWhere('s.startTime >= :weekStart', { weekStart })
      .andWhere('s.startTime < :weekEnd', { weekEnd })
      .getMany();

    if (shifts.length === 0) {
      return { totalShifts: 0, fullyStaffedShifts: 0, utilizationPct: 0 };
    }

    const fullyStaffed = shifts.filter(
      (s) => (s.assignments ?? []).length >= s.headcount,
    ).length;

    return {
      totalShifts: shifts.length,
      fullyStaffedShifts: fullyStaffed,
      utilizationPct: Math.round((fullyStaffed / shifts.length) * 100),
    };
  }
}
