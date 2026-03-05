import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from '../shifts/entities/shift.entity';
import { ShiftAssignment } from '../shifts/entities/shift-assignment.entity';
import { ShiftStatus } from '../../common/enums/shift-status.enum';
import { toUTCDateString } from '../../common/utils/date.utils';

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  shifts: ShiftWithAssignees[];
}

export interface ShiftWithAssignees {
  id: string;
  startTime: Date;
  endTime: Date;
  headcount: number;
  filledCount: number;
  status: ShiftStatus;
  isPremium: boolean;
  notes: string | null;
  location: { id: string; name: string; timezone: string };
  assignees: { userId: string; firstName: string; lastName: string }[];
}

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,

    @InjectRepository(ShiftAssignment)
    private readonly assignmentRepo: Repository<ShiftAssignment>,
  ) {}

  // ── Weekly schedule for a location ────────────────────────────────────────
  async getWeeklySchedule(
    locationId: string,
    weekStart: Date,
  ): Promise<DaySchedule[]> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const shifts = await this.shiftRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.location', 'loc')
      .leftJoinAndSelect('s.assignments', 'a')
      .leftJoinAndSelect('a.user', 'u')
      .where('s.locationId = :locationId', { locationId })
      .andWhere('s.startTime >= :weekStart', { weekStart })
      .andWhere('s.startTime < :weekEnd', { weekEnd })
      .andWhere('s.deletedAt IS NULL')
      .orderBy('s.startTime', 'ASC')
      .getMany();

    return this.groupByDay(shifts, weekStart);
  }

  // ── Personal weekly schedule ───────────────────────────────────────────────
  async getMySchedule(
    userId: string,
    weekStart: Date,
  ): Promise<ShiftWithAssignees[]> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const assignments = await this.assignmentRepo
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.shift', 's')
      .leftJoinAndSelect('s.location', 'loc')
      .leftJoinAndSelect('s.assignments', 'allAssignments')
      .leftJoinAndSelect('allAssignments.user', 'u')
      .where('a.userId = :userId', { userId })
      .andWhere('s.startTime >= :weekStart', { weekStart })
      .andWhere('s.startTime < :weekEnd', { weekEnd })
      .andWhere('s.deletedAt IS NULL')
      .orderBy('s.startTime', 'ASC')
      .getMany();

    return assignments.map((a) => this.toShiftWithAssignees(a.shift));
  }

  // ── Flat export (all published shifts in range) ────────────────────────────
  async exportSchedule(
    locationId: string,
    weekStart: Date,
  ): Promise<
    {
      date: string;
      startTime: Date;
      endTime: Date;
      headcount: number;
      assignees: string[];
      isPremium: boolean;
    }[]
  > {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const shifts = await this.shiftRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.assignments', 'a')
      .leftJoinAndSelect('a.user', 'u')
      .where('s.locationId = :locationId', { locationId })
      .andWhere('s.startTime >= :weekStart', { weekStart })
      .andWhere('s.startTime < :weekEnd', { weekEnd })
      .andWhere('s.status = :status', { status: ShiftStatus.PUBLISHED })
      .andWhere('s.deletedAt IS NULL')
      .orderBy('s.startTime', 'ASC')
      .getMany();

    return shifts.map((s) => ({
      date: toUTCDateString(s.startTime),
      startTime: s.startTime,
      endTime: s.endTime,
      headcount: s.headcount,
      isPremium: s.isPremium,
      assignees: (s.assignments ?? []).map(
        (a) => `${a.user.firstName} ${a.user.lastName}`,
      ),
    }));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private groupByDay(shifts: Shift[], weekStart: Date): DaySchedule[] {
    const days: DaySchedule[] = [];
    const DAY_NAMES = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      const dateStr = toUTCDateString(day);

      const dayShifts = shifts.filter(
        (s) => toUTCDateString(s.startTime) === dateStr,
      );

      days.push({
        date: dateStr,
        dayOfWeek: DAY_NAMES[day.getUTCDay()],
        shifts: dayShifts.map(this.toShiftWithAssignees),
      });
    }

    return days;
  }

  private toShiftWithAssignees(s: Shift): ShiftWithAssignees {
    return {
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      headcount: s.headcount,
      filledCount: s.assignments?.length ?? 0,
      status: s.status,
      isPremium: s.isPremium,
      notes: s.notes,
      location: {
        id: s.location?.id ?? s.locationId,
        name: s.location?.name ?? '',
        timezone: s.location?.timezone ?? 'UTC',
      },
      assignees: (s.assignments ?? []).map((a) => ({
        userId: a.userId,
        firstName: a.user?.firstName ?? '',
        lastName: a.user?.lastName ?? '',
      })),
    };
  }
}
