import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftsRepository } from './shifts.repository';
import { ConstraintService } from './constraint.service';
import { Shift } from './entities/shift.entity';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { CreateShiftDto } from './dto/request/create-shift.dto';
import { UpdateShiftDto } from './dto/request/update-shift.dto';
import { QueryShiftDto } from './dto/request/query-shift.dto';
import { AssignStaffDto } from './dto/request/assign-shift.dto';
import { UsersService } from '../users/users.service';
import { LocationsService } from '../locations/locations.service';
import { ShiftStatus } from '../../common/enums/shift-status.enum';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

const EDIT_CUTOFF_HOURS = 48;

@Injectable()
export class ShiftsService {
  constructor(
    private readonly shiftsRepository: ShiftsRepository,
    private readonly constraintService: ConstraintService,
    private readonly usersService: UsersService,
    private readonly locationsService: LocationsService,
    @InjectRepository(ShiftAssignment)
    private readonly assignmentRepo: Repository<ShiftAssignment>,
  ) {}

  async findAll(
    query: QueryShiftDto,
    caller?: User,
  ): Promise<[Shift[], number]> {
    return this.shiftsRepository.findAll(query, caller);
  }

  async findById(id: string, caller?: User): Promise<Shift> {
    const shift = await this.shiftsRepository.findById(id);
    if (!shift) throw new NotFoundException(`Shift ${id} not found`);

    if (caller?.role === Role.STAFF) {
      // Staff may only see published shifts at locations they are certified at
      if (shift.status !== ShiftStatus.PUBLISHED) {
        throw new NotFoundException(`Shift ${id} not found`);
      }
      const certified = await this.locationsService.isStaffCertified(
        caller.id,
        shift.locationId,
      );
      if (!certified) throw new NotFoundException(`Shift ${id} not found`);
    } else if (caller?.role === Role.MANAGER) {
      await this.locationsService.assertCanAccessLocation(
        caller,
        shift.locationId,
      );
    }

    return shift;
  }

  async create(dto: CreateShiftDto, createdBy: User): Promise<Shift> {
    await this.locationsService.findById(dto.locationId); // validate location exists

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('endTime must be after startTime');
    }

    const shift = this.shiftsRepository.orm.create({
      locationId: dto.locationId,
      requiredSkillId: dto.requiredSkillId ?? null,
      startTime,
      endTime,
      headcount: dto.headcount ?? 1,
      notes: dto.notes ?? null,
      status: ShiftStatus.DRAFT,
      isPremium: this.isPremiumShift(startTime),
    });

    return this.shiftsRepository.save(shift);
  }

  async update(
    id: string,
    dto: UpdateShiftDto,
    requestingUser: User,
  ): Promise<Shift> {
    const shift = await this.findById(id);

    await this.assertManagerOrAdmin(requestingUser, shift.locationId);
    this.assertEditableBeforeCutoff(shift);

    if (dto.startTime) shift.startTime = new Date(dto.startTime);
    if (dto.endTime) shift.endTime = new Date(dto.endTime);
    if (shift.endTime <= shift.startTime) {
      throw new BadRequestException('endTime must be after startTime');
    }

    Object.assign(shift, {
      ...(dto.requiredSkillId !== undefined && {
        requiredSkillId: dto.requiredSkillId,
      }),
      ...(dto.headcount !== undefined && { headcount: dto.headcount }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });

    shift.isPremium = this.isPremiumShift(shift.startTime);

    return this.shiftsRepository.save(shift);
  }

  async remove(id: string, requestingUser: User): Promise<void> {
    const shift = await this.findById(id);
    await this.assertManagerOrAdmin(requestingUser, shift.locationId);
    await this.shiftsRepository.softDelete(id);
  }

  // ── Publish / Unpublish ──────────────────────────────────────────────────

  async publish(id: string, requestingUser: User): Promise<Shift> {
    const shift = await this.findById(id);
    await this.assertManagerOrAdmin(requestingUser, shift.locationId);

    if (shift.status === ShiftStatus.PUBLISHED) {
      throw new BadRequestException('Shift is already published');
    }

    shift.status = ShiftStatus.PUBLISHED;
    shift.publishedAt = new Date();
    shift.publishedById = requestingUser.id;

    return this.shiftsRepository.save(shift);
  }

  async unpublish(id: string, requestingUser: User): Promise<Shift> {
    const shift = await this.findById(id);
    await this.assertManagerOrAdmin(requestingUser, shift.locationId);

    this.assertEditableBeforeCutoff(shift);

    if (shift.status !== ShiftStatus.PUBLISHED) {
      throw new BadRequestException('Shift is not published');
    }

    shift.status = ShiftStatus.DRAFT;
    shift.publishedAt = null;
    shift.publishedById = null;

    return this.shiftsRepository.save(shift);
  }

  // ── Assignments ──────────────────────────────────────────────────────────

  /**
   * Assign a staff member to a shift.
   * Runs full constraint check; hard blocks if violations exist unless manager overrides.
   */
  async assignStaff(
    shiftId: string,
    dto: AssignStaffDto,
    requestingUser: User,
    managerOverride = false,
  ): Promise<{
    assignment: ShiftAssignment;
    warnings: string[];
    hardBlock: boolean;
  }> {
    const shift = await this.findById(shiftId);
    const user = await this.usersService.findById(dto.userId);

    await this.assertManagerOrAdmin(requestingUser, shift.locationId);

    // Check if slot is available
    const currentAssignments = shift.assignments?.length ?? 0;
    if (currentAssignments >= shift.headcount) {
      throw new BadRequestException(
        `Shift is fully staffed (${shift.headcount}/${shift.headcount} slots filled)`,
      );
    }

    // Already assigned?
    const alreadyAssigned = shift.assignments?.some(
      (a) => a.userId === dto.userId,
    );
    if (alreadyAssigned) {
      throw new BadRequestException(
        `${user.fullName} is already assigned to this shift`,
      );
    }

    // Run constraint checks
    const constraintResult =
      await this.constraintService.checkAssignmentConstraints(shift, user);

    if (!constraintResult.valid && !managerOverride) {
      throw new BadRequestException({
        message: 'Assignment violates scheduling constraints',
        violations: constraintResult.violations,
        suggestions: constraintResult.suggestions,
      });
    }

    // Overtime warnings (non-blocking unless hardBlock)
    const overtimeResult = await this.constraintService.checkOvertimeWarnings(
      shift,
      user,
    );

    if (overtimeResult.hardBlock && !managerOverride) {
      throw new BadRequestException({
        message:
          'Assignment blocked due to daily hour limit or 7th consecutive day rule',
        warnings: overtimeResult.warnings,
        requiresOverride: true,
      });
    }

    // Use pessimistic lock to prevent concurrent double-assignment
    const assignment = await this.assignmentRepo.manager.transaction(
      async (em) => {
        // Re-check inside transaction with lock
        const locked = await em
          .createQueryBuilder(ShiftAssignment, 'a')
          .setLock('pessimistic_write')
          .where('a.shiftId = :shiftId', { shiftId })
          .getMany();

        if (locked.length >= shift.headcount) {
          throw new BadRequestException(
            'Shift became fully staffed just now — try again',
          );
        }

        const newAssignment = em.create(ShiftAssignment, {
          shiftId,
          userId: dto.userId,
          assignedById: requestingUser.id,
          notes: dto.notes ?? null,
          isSwapPending: false,
        });

        return em.save(ShiftAssignment, newAssignment);
      },
    );

    return {
      assignment,
      warnings: [
        ...constraintResult.violations.map((v) => v.message),
        ...overtimeResult.warnings,
      ],
      hardBlock: overtimeResult.hardBlock,
    };
  }

  async unassignStaff(
    shiftId: string,
    userId: string,
    requestingUser: User,
  ): Promise<void> {
    const shift = await this.findById(shiftId);
    await this.assertManagerOrAdmin(requestingUser, shift.locationId);
    this.assertEditableBeforeCutoff(shift);

    const assignment = await this.assignmentRepo.findOne({
      where: { shiftId, userId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    await this.assignmentRepo.remove(assignment);
  }

  async getAssignmentsForUser(
    userId: string,
    query: QueryShiftDto,
  ): Promise<Shift[]> {
    const [shifts] = await this.shiftsRepository.findAll({ ...query, userId });
    return shifts;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async assertManagerOrAdmin(
    user: User,
    locationId: string,
  ): Promise<void> {
    if (user.role === Role.ADMIN) return;
    if (user.role !== Role.MANAGER)
      throw new ForbiddenException(
        'Only managers and admins can manage shifts',
      );
    await this.locationsService.assertCanAccessLocation(user, locationId);
  }

  private assertEditableBeforeCutoff(shift: Shift): void {
    if (shift.status !== ShiftStatus.PUBLISHED) return;
    const cutoff = new Date(
      shift.startTime.getTime() - EDIT_CUTOFF_HOURS * 60 * 60 * 1000,
    );
    if (new Date() > cutoff) {
      throw new BadRequestException(
        `Shift cannot be edited within ${EDIT_CUTOFF_HOURS} hours of start time`,
      );
    }
  }

  private isPremiumShift(startTime: Date): boolean {
    const day = startTime.getUTCDay(); // 0=Sun, 5=Fri, 6=Sat
    const hour = startTime.getUTCHours();
    return (day === 5 || day === 6) && hour >= 17;
  }
}
