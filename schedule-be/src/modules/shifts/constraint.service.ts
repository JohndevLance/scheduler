import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { Shift } from './entities/shift.entity';
import { User } from '../users/entities/user.entity';
import { Availability } from '../users/entities/availability.entity';
import { AvailabilityException } from '../users/entities/availability-exception.entity';
import { LocationsService } from '../locations/locations.service';
import {
  startOfDayUTC,
  endOfDayUTC,
  getWeekStartSunday,
  getWeekEndSunday,
  toUTCDateString,
  toUTCMinutes,
  toLocalMinutes,
  toLocalDayOfWeek,
  toLocalDateString,
} from '../../common/utils/date.utils';

export interface Violation {
  rule: string;
  message: string;
  affectedUserId?: string;
  affectedShiftId?: string;
}

export interface Suggestion {
  userId: string;
  userName: string;
  reason: string;
}

export interface ConstraintResult {
  valid: boolean;
  violations: Violation[];
  suggestions: Suggestion[];
}

@Injectable()
export class ConstraintService {
  constructor(
    @InjectRepository(ShiftAssignment)
    private readonly assignmentRepo: Repository<ShiftAssignment>,
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,
    @InjectRepository(Availability)
    private readonly availabilityRepo: Repository<Availability>,
    @InjectRepository(AvailabilityException)
    private readonly exceptionRepo: Repository<AvailabilityException>,
    private readonly locationsService: LocationsService,
  ) {}

  /**
   * Full constraint check before assigning a user to a shift.
   * Returns structured violations and alternative suggestions.
   */
  async checkAssignmentConstraints(
    shift: Shift,
    user: User,
    excludeAssignmentId?: string, // for swap/re-assign scenarios
    skipSuggestions = false,
  ): Promise<ConstraintResult> {
    const violations: Violation[] = [];

    await Promise.all([
      this.checkLocationCertification(shift, user, violations),
      this.checkSkillRequirement(shift, user, violations),
      this.checkDoubleBooking(shift, user, violations, excludeAssignmentId),
      this.checkMinRestPeriod(shift, user, violations, excludeAssignmentId),
      this.checkAvailability(shift, user, violations),
    ]);

    const suggestions =
      !skipSuggestions && violations.length > 0
        ? await this.suggestAlternatives(shift)
        : [];

    return {
      valid: violations.length === 0,
      violations,
      suggestions,
    };
  }

  // ── Rule 1: Staff must be certified at this location ─────────────────────
  private async checkLocationCertification(
    shift: Shift,
    user: User,
    violations: Violation[],
  ): Promise<void> {
    const certified = await this.locationsService.isStaffCertified(
      user.id,
      shift.locationId,
    );
    if (!certified) {
      violations.push({
        rule: 'LOCATION_CERTIFICATION',
        message: `${user.fullName} is not certified to work at ${shift.location?.name ?? shift.locationId}. They must be certified before being assigned.`,
        affectedUserId: user.id,
        affectedShiftId: shift.id,
      });
    }
  }

  // ── Rule 2: Staff must have the required skill ────────────────────────────
  private checkSkillRequirement(
    shift: Shift,
    user: User,
    violations: Violation[],
  ): void {
    if (!shift.requiredSkillId) return;

    const hasSkill = user.skills?.some((s) => s.id === shift.requiredSkillId);
    if (!hasSkill) {
      const skillName = shift.requiredSkill?.name ?? shift.requiredSkillId;
      violations.push({
        rule: 'SKILL_REQUIREMENT',
        message: `${user.fullName} does not have the required skill "${skillName}" for this shift.`,
        affectedUserId: user.id,
        affectedShiftId: shift.id,
      });
    }
  }

  // ── Rule 3: No double-booking (overlapping shifts, any location) ──────────
  private async checkDoubleBooking(
    shift: Shift,
    user: User,
    violations: Violation[],
    excludeAssignmentId?: string,
  ): Promise<void> {
    const overlapping = await this.assignmentRepo
      .createQueryBuilder('a')
      .innerJoin('a.shift', 's')
      .where('a.userId = :userId', { userId: user.id })
      .andWhere('s.startTime < :end', { end: shift.endTime })
      .andWhere('s.endTime > :start', { start: shift.startTime })
      .andWhere('s.id != :shiftId', { shiftId: shift.id })
      .andWhere('s.deletedAt IS NULL')
      .andWhere(excludeAssignmentId ? 'a.id != :excludeId' : '1=1', {
        excludeId: excludeAssignmentId,
      })
      .getCount();

    if (overlapping > 0) {
      const tz = shift.location?.timezone ?? 'UTC';
      const fmtTime = (d: Date) =>
        new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(d);
      violations.push({
        rule: 'DOUBLE_BOOKING',
        message: `${user.fullName} is already assigned to an overlapping shift: ${fmtTime(shift.startTime)} – ${fmtTime(shift.endTime)}.`,
        affectedUserId: user.id,
        affectedShiftId: shift.id,
      });
    }
  }

  // ── Rule 4: Minimum 10-hour rest between shifts ───────────────────────────
  private async checkMinRestPeriod(
    shift: Shift,
    user: User,
    violations: Violation[],
    excludeAssignmentId?: string,
  ): Promise<void> {
    const MIN_REST_MS = 10 * 60 * 60 * 1000; // 10 hours

    const windowStart = new Date(shift.startTime.getTime() - MIN_REST_MS);
    const windowEnd = new Date(shift.endTime.getTime() + MIN_REST_MS);

    const nearby = await this.assignmentRepo
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.shift', 's')
      .where('a.userId = :userId', { userId: user.id })
      .andWhere('s.id != :shiftId', { shiftId: shift.id })
      .andWhere('s.startTime < :windowEnd', { windowEnd })
      .andWhere('s.endTime > :windowStart', { windowStart })
      .andWhere('s.deletedAt IS NULL')
      .andWhere(excludeAssignmentId ? 'a.id != :excludeId' : '1=1', {
        excludeId: excludeAssignmentId,
      })
      .getMany();

    for (const assignment of nearby) {
      const other = assignment.shift;

      // Only flag if there's < 10h gap (but not an actual overlap — that's Rule 3)
      const gapAfterOther = shift.startTime.getTime() - other.endTime.getTime();
      const gapBeforeOther =
        other.startTime.getTime() - shift.endTime.getTime();

      const tooClose =
        (gapAfterOther > 0 && gapAfterOther < MIN_REST_MS) ||
        (gapBeforeOther > 0 && gapBeforeOther < MIN_REST_MS);

      if (tooClose) {
        const hours = Math.floor(
          Math.min(
            gapAfterOther > 0 ? gapAfterOther : Infinity,
            gapBeforeOther > 0 ? gapBeforeOther : Infinity,
          ) /
            (1000 * 60 * 60),
        );
        violations.push({
          rule: 'MIN_REST_PERIOD',
          message: `${user.fullName} would only have ${hours} hour(s) of rest before/after another shift. Minimum required is 10 hours.`,
          affectedUserId: user.id,
          affectedShiftId: shift.id,
        });
        break;
      }
    }
  }

  // ── Rule 5: Staff must be available during shift hours ───────────────────
  private async checkAvailability(
    shift: Shift,
    user: User,
    violations: Violation[],
  ): Promise<void> {
    const locationTimezone = shift.location?.timezone ?? 'UTC';
    const shiftDate = toLocalDateString(shift.startTime, locationTimezone);
    const dayOfWeek = toLocalDayOfWeek(shift.startTime, locationTimezone);

    // Check one-off exceptions first
    const exception = await this.exceptionRepo.findOne({
      where: { userId: user.id, date: shiftDate },
    });

    if (exception) {
      if (exception.isUnavailableAllDay) {
        violations.push({
          rule: 'AVAILABILITY_EXCEPTION',
          message: `${user.fullName} has marked themselves unavailable all day on ${shiftDate}.`,
          affectedUserId: user.id,
          affectedShiftId: shift.id,
        });
        return;
      }
      // Exception with specific window — check if shift falls outside it
      if (exception.startTime && exception.endTime) {
        const available = this.timeWindowCovers(
          exception.startTime,
          exception.endTime,
          shift.startTime,
          shift.endTime,
          locationTimezone,
        );
        if (!available) {
          violations.push({
            rule: 'AVAILABILITY_EXCEPTION',
            message: `${user.fullName} is only available ${exception.startTime}–${exception.endTime} on ${shiftDate} (exception override).`,
            affectedUserId: user.id,
            affectedShiftId: shift.id,
          });
        }
        return;
      }
    }

    // Check recurring weekly availability
    const availability = await this.availabilityRepo.findOne({
      where: { userId: user.id, dayOfWeek },
    });

    if (!availability || !availability.isAvailable) {
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
        dayOfWeek
      ];
      violations.push({
        rule: 'AVAILABILITY_RECURRING',
        message: `${user.fullName} has not set availability for ${dayName}s.`,
        affectedUserId: user.id,
        affectedShiftId: shift.id,
      });
      return;
    }

    const covers = this.timeWindowCovers(
      availability.startTime,
      availability.endTime,
      shift.startTime,
      shift.endTime,
      locationTimezone,
    );

    if (!covers) {
      violations.push({
        rule: 'AVAILABILITY_RECURRING',
        message: `${user.fullName} is only available ${availability.startTime}–${availability.endTime} but the shift runs ${new Intl.DateTimeFormat('en-US', { timeZone: locationTimezone, hour: 'numeric', minute: '2-digit', hour12: true }).format(shift.startTime)} – ${new Intl.DateTimeFormat('en-US', { timeZone: locationTimezone, hour: 'numeric', minute: '2-digit', hour12: true }).format(shift.endTime)}.`,
        affectedUserId: user.id,
        affectedShiftId: shift.id,
      });
    }
  }

  /**
   * Checks whether an availability time window (HH:mm strings in location local time)
   * covers the given shift period (UTC timestamps), converted to location local time.
   */
  private timeWindowCovers(
    availStart: string,
    availEnd: string,
    shiftStart: Date,
    shiftEnd: Date,
    timezone = 'UTC',
  ): boolean {
    const [startH, startM] = availStart.split(':').map(Number);
    const [endH, endM] = availEnd.split(':').map(Number);

    const shiftStartMins = toLocalMinutes(shiftStart, timezone);
    const shiftEndMins = toLocalMinutes(shiftEnd, timezone);
    const availStartMins = startH * 60 + startM;
    const availEndMins = endH * 60 + endM;

    // Overnight availability window (e.g. 22:00 – 04:00)
    if (availEndMins < availStartMins) {
      return shiftStartMins >= availStartMins || shiftEndMins <= availEndMins;
    }

    return shiftStartMins >= availStartMins && shiftEndMins <= availEndMins;
  }

  // ── Overtime warnings (soft checks, not hard blocks unless 12h/day) ──────

  async checkOvertimeWarnings(
    shift: Shift,
    user: User,
  ): Promise<{ warnings: string[]; hardBlock: boolean }> {
    const warnings: string[] = [];
    let hardBlock = false;

    const weekStart = getWeekStartSunday(shift.startTime);
    const weekEnd = getWeekEndSunday(shift.startTime);

    // Current week hours
    const weekHours = await this.getWeeklyHours(
      user.id,
      weekStart,
      weekEnd,
      shift.id,
    );
    const shiftDuration = shift.durationHours;
    const projectedWeekly = weekHours + shiftDuration;

    if (projectedWeekly > 40) {
      warnings.push(
        `This assignment would bring ${user.fullName} to ${projectedWeekly.toFixed(1)} hours this week — exceeding the 40-hour overtime threshold.`,
      );
    } else if (projectedWeekly >= 35) {
      warnings.push(
        `${user.fullName} would be at ${projectedWeekly.toFixed(1)} hours this week (approaching 40-hour overtime threshold).`,
      );
    }

    // Daily hours check
    const dayStart = startOfDayUTC(shift.startTime);
    const dayEnd = endOfDayUTC(shift.startTime);

    const dayHours = await this.getDailyHours(
      user.id,
      dayStart,
      dayEnd,
      shift.id,
    );
    const projectedDaily = dayHours + shiftDuration;

    if (projectedDaily > 12) {
      warnings.push(
        `${user.fullName} would work ${projectedDaily.toFixed(1)} hours on this day — exceeding the 12-hour hard limit.`,
      );
      hardBlock = true;
    } else if (projectedDaily > 8) {
      warnings.push(
        `${user.fullName} would work ${projectedDaily.toFixed(1)} hours on this day (exceeds 8-hour guideline).`,
      );
    }

    // Consecutive days check
    const consecutiveDays = await this.getConsecutiveWorkDays(
      user.id,
      shift.startTime,
    );

    if (consecutiveDays >= 6) {
      warnings.push(
        `This would be ${user.fullName}'s ${consecutiveDays + 1}th consecutive working day. ` +
          (consecutiveDays >= 6
            ? 'Manager override with reason required for 7th day.'
            : 'Warning: 6th consecutive day.'),
      );
      if (consecutiveDays >= 6) hardBlock = true; // 7th day needs override
    }

    return { warnings, hardBlock };
  }

  async getWeeklyHours(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
    excludeShiftId?: string,
  ): Promise<number> {
    const assignments = await this.assignmentRepo
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.shift', 's')
      .where('a.userId = :userId', { userId })
      .andWhere('s.startTime >= :weekStart', { weekStart })
      .andWhere('s.startTime <= :weekEnd', { weekEnd })
      .andWhere('s.deletedAt IS NULL')
      .andWhere(excludeShiftId ? 's.id != :excludeShiftId' : '1=1', {
        excludeShiftId,
      })
      .getMany();

    return assignments.reduce((sum, a) => {
      const s = a.shift;
      return (
        sum + (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60 * 60)
      );
    }, 0);
  }

  private async getDailyHours(
    userId: string,
    dayStart: Date,
    dayEnd: Date,
    excludeShiftId?: string,
  ): Promise<number> {
    const assignments = await this.assignmentRepo
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.shift', 's')
      .where('a.userId = :userId', { userId })
      .andWhere('s.startTime >= :dayStart', { dayStart })
      .andWhere('s.startTime <= :dayEnd', { dayEnd })
      .andWhere('s.deletedAt IS NULL')
      .andWhere(excludeShiftId ? 's.id != :excludeShiftId' : '1=1', {
        excludeShiftId,
      })
      .getMany();

    return assignments.reduce((sum, a) => {
      const s = a.shift;
      return (
        sum + (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60 * 60)
      );
    }, 0);
  }

  async getConsecutiveWorkDays(
    userId: string,
    fromDate: Date,
  ): Promise<number> {
    // Walk backwards from fromDate - 1 counting consecutive days with shifts
    let consecutive = 0;
    const checkDate = new Date(fromDate);
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);

    for (let i = 0; i < 7; i++) {
      const dayStart = startOfDayUTC(checkDate);
      const dayEnd = endOfDayUTC(checkDate);

      const count = await this.assignmentRepo
        .createQueryBuilder('a')
        .innerJoin('a.shift', 's')
        .where('a.userId = :userId', { userId })
        .andWhere('s.startTime >= :dayStart', { dayStart })
        .andWhere('s.startTime <= :dayEnd', { dayEnd })
        .andWhere('s.deletedAt IS NULL')
        .getCount();

      if (count === 0) break;
      consecutive++;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    }

    return consecutive;
  }

  // ── Suggestions ──────────────────────────────────────────────────────────

  private async suggestAlternatives(shift: Shift): Promise<Suggestion[]> {
    // Find staff certified for the location with the required skill
    const certified = await this.locationsService.getStaffForLocation(
      shift.locationId,
      true,
    );

    const candidates: Suggestion[] = [];

    for (const cert of certified) {
      const user = cert.user;
      if (!user) continue;

      // Filter by skill
      if (
        shift.requiredSkillId &&
        !user.skills?.some((s) => s.id === shift.requiredSkillId)
      ) {
        continue;
      }

      // Quick availability + double-booking check (no suggestions to avoid recursion)
      const result = await this.checkAssignmentConstraints(shift, user, undefined, true);

      if (result.valid) {
        candidates.push({
          userId: user.id,
          userName: user.fullName,
          reason: `Certified, has required skill, available, and free during this time.`,
        });
      }

      if (candidates.length >= 5) break; // cap suggestions
    }

    return candidates;
  }
}
