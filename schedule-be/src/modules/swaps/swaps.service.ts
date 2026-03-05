import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SwapRequest } from './entities/swap-request.entity';
import { ShiftAssignment } from '../shifts/entities/shift-assignment.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { ConstraintService } from '../shifts/constraint.service';
import { LocationsService } from '../locations/locations.service';
import { CreateSwapDto } from './dto/request/create-swap.dto';
import { ResolveSwapDto } from './dto/request/resolve-swap.dto';
import { QuerySwapDto } from './dto/request/query-swap.dto';
import { SwapStatus, SwapType } from '../../common/enums/swap-status.enum';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

export interface EligibleCover {
  userId: string;
  firstName: string;
  lastName: string;
  canCover: boolean;
  violations: string[];
}

@Injectable()
export class SwapsService {
  constructor(
    @InjectRepository(SwapRequest)
    private readonly swapRepo: Repository<SwapRequest>,

    @InjectRepository(ShiftAssignment)
    private readonly assignmentRepo: Repository<ShiftAssignment>,

    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,

    private readonly constraintService: ConstraintService,
    private readonly locationsService: LocationsService,
  ) {}

  // ── Eligible covers for a shift (staff-accessible) ──────────────────────

  async getEligibleCovers(
    shiftId: string,
    requesterId: string,
  ): Promise<EligibleCover[]> {
    const shift = await this.shiftRepo.findOne({
      where: { id: shiftId },
      relations: ['location'],
    });
    if (!shift) throw new NotFoundException(`Shift ${shiftId} not found`);

    const certified = await this.locationsService.getStaffForLocation(
      shift.locationId,
      true,
    );

    const results: EligibleCover[] = [];

    for (const cert of certified) {
      const user = cert.user;
      if (!user || user.id === requesterId) continue;

      // Check if already assigned to this shift
      const alreadyAssigned = await this.assignmentRepo.findOne({
        where: { shiftId, userId: user.id },
      });
      if (alreadyAssigned) continue;

      const result = await this.constraintService.checkAssignmentConstraints(
        shift,
        user,
        undefined,
        true, // skipSuggestions — avoid recursion
      );

      results.push({
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        canCover: result.valid,
        violations: result.violations.map((v) => v.message),
      });
    }

    // Eligible first, then ineligible — both sorted by name
    return results.sort((a, b) => {
      if (a.canCover !== b.canCover) return a.canCover ? -1 : 1;
      return a.lastName.localeCompare(b.lastName);
    });
  }

  // ── Create ──────────────────────────────────────────────────────────────

  async createSwapRequest(
    dto: CreateSwapDto,
    requester: User,
  ): Promise<SwapRequest> {
    // Verify requester is assigned to this shift
    const assignment = await this.assignmentRepo.findOne({
      where: { shiftId: dto.shiftId, userId: requester.id },
    });
    if (!assignment) {
      throw new BadRequestException('You are not assigned to this shift');
    }

    // Check no existing open request for this shift from this user
    const existing = await this.swapRepo.findOne({
      where: {
        shiftId: dto.shiftId,
        requesterId: requester.id,
        status: SwapStatus.PENDING_ACCEPTANCE,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'You already have an open swap request for this shift',
      );
    }

    // DROP type goes straight to PENDING_APPROVAL (no specific cover needed)
    const initialStatus =
      dto.type === SwapType.DROP
        ? SwapStatus.PENDING_APPROVAL
        : SwapStatus.PENDING_ACCEPTANCE;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

    const swap = this.swapRepo.create({
      shiftId: dto.shiftId,
      requesterId: requester.id,
      coverId: dto.coverId ?? null,
      type: dto.type,
      status: initialStatus,
      requesterNote: dto.requesterNote ?? null,
      expiresAt,
    });

    return this.swapRepo.save(swap);
  }

  // ── Cover accepts (SWAP type only) ──────────────────────────────────────

  async acceptSwap(swapId: string, cover: User): Promise<SwapRequest> {
    const swap = await this.findByIdOrThrow(swapId);

    if (swap.type !== SwapType.SWAP) {
      throw new BadRequestException(
        'Only SWAP requests require cover acceptance',
      );
    }
    if (swap.status !== SwapStatus.PENDING_ACCEPTANCE) {
      throw new BadRequestException(`Swap is ${swap.status}, cannot accept`);
    }
    if (swap.coverId && swap.coverId !== cover.id) {
      throw new ForbiddenException(
        'This swap was directed at a different person',
      );
    }

    swap.coverId = cover.id;
    swap.status = SwapStatus.PENDING_APPROVAL;
    return this.swapRepo.save(swap);
  }

  // ── Manager approves ─────────────────────────────────────────────────────

  async approveRequest(
    swapId: string,
    manager: User,
    dto: ResolveSwapDto,
  ): Promise<SwapRequest> {
    const swap = await this.findByIdOrThrow(swapId);

    if (swap.status !== SwapStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Swap is ${swap.status}, cannot approve`);
    }

    if (swap.type === SwapType.SWAP && !swap.coverId) {
      throw new BadRequestException(
        'No cover assigned — cover must accept first',
      );
    }

    // Transfer assignment: remove requester, add cover (for SWAP)
    if (swap.type === SwapType.SWAP && swap.coverId) {
      await this.assignmentRepo.delete({
        shiftId: swap.shiftId,
        userId: swap.requesterId,
      });

      const existing = await this.assignmentRepo.findOne({
        where: { shiftId: swap.shiftId, userId: swap.coverId },
      });
      if (!existing) {
        await this.assignmentRepo.save(
          this.assignmentRepo.create({
            shiftId: swap.shiftId,
            userId: swap.coverId,
            assignedById: manager.id,
            notes: `Swap approved from ${swap.requesterId}`,
          }),
        );
      }
    } else if (swap.type === SwapType.DROP) {
      // DROP — just remove the requester from the shift
      await this.assignmentRepo.delete({
        shiftId: swap.shiftId,
        userId: swap.requesterId,
      });
    }

    swap.status = SwapStatus.APPROVED;
    swap.resolvedById = manager.id;
    swap.resolvedAt = new Date();
    swap.managerNote = dto.managerNote ?? null;
    return this.swapRepo.save(swap);
  }

  // ── Manager denies ────────────────────────────────────────────────────────

  async denyRequest(
    swapId: string,
    manager: User,
    dto: ResolveSwapDto,
  ): Promise<SwapRequest> {
    const swap = await this.findByIdOrThrow(swapId);

    if (
      ![SwapStatus.PENDING_APPROVAL, SwapStatus.PENDING_ACCEPTANCE].includes(
        swap.status,
      )
    ) {
      throw new BadRequestException(`Swap is ${swap.status}, cannot deny`);
    }

    swap.status = SwapStatus.REJECTED;
    swap.resolvedById = manager.id;
    swap.resolvedAt = new Date();
    swap.managerNote = dto.managerNote ?? null;
    return this.swapRepo.save(swap);
  }

  // ── Requester cancels ─────────────────────────────────────────────────────

  async cancelRequest(swapId: string, requester: User): Promise<SwapRequest> {
    const swap = await this.findByIdOrThrow(swapId);

    if (swap.requesterId !== requester.id && requester.role === Role.STAFF) {
      throw new ForbiddenException(
        'You can only cancel your own swap requests',
      );
    }
    if ([SwapStatus.APPROVED, SwapStatus.REJECTED].includes(swap.status)) {
      throw new BadRequestException('Cannot cancel a resolved swap');
    }

    swap.status = SwapStatus.CANCELLED;
    swap.resolvedAt = new Date();
    return this.swapRepo.save(swap);
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  async findAll(
    query: QuerySwapDto,
    requestingUser: User,
  ): Promise<[SwapRequest[], number]> {
    const qb = this.swapRepo
      .createQueryBuilder('sw')
      .leftJoinAndSelect('sw.shift', 's')
      .leftJoinAndSelect('sw.requester', 'requester')
      .leftJoinAndSelect('sw.cover', 'cover')
      .orderBy('sw.createdAt', 'DESC');

    // Staff can only see their own swaps
    if (requestingUser.role === Role.STAFF) {
      qb.andWhere('(sw.requesterId = :uid OR sw.coverId = :uid)', {
        uid: requestingUser.id,
      });
    }

    if (query.status)
      qb.andWhere('sw.status = :status', { status: query.status });
    if (query.type) qb.andWhere('sw.type = :type', { type: query.type });
    if (query.requesterId)
      qb.andWhere('sw.requesterId = :rid', { rid: query.requesterId });
    if (query.locationId)
      qb.andWhere('s.locationId = :lid', { lid: query.locationId });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }

  async findById(id: string, caller?: User): Promise<SwapRequest> {
    const swap = await this.findByIdOrThrow(id);
    if (caller?.role === Role.STAFF) {
      if (swap.requesterId !== caller.id && swap.coverId !== caller.id) {
        throw new NotFoundException(`SwapRequest ${id} not found`);
      }
    }
    return swap;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async findByIdOrThrow(id: string): Promise<SwapRequest> {
    const swap = await this.swapRepo.findOne({
      where: { id },
      relations: ['shift', 'requester', 'cover', 'resolvedBy'],
    });
    if (!swap) throw new NotFoundException(`SwapRequest ${id} not found`);
    return swap;
  }
}
