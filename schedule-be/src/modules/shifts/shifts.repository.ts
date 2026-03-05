import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Shift } from './entities/shift.entity';
import { QueryShiftDto } from './dto/request/query-shift.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { ShiftStatus } from '../../common/enums/shift-status.enum';

@Injectable()
export class ShiftsRepository {
  constructor(
    @InjectRepository(Shift)
    private readonly repo: Repository<Shift>,
  ) {}

  get orm(): Repository<Shift> {
    return this.repo;
  }

  private baseQuery(): SelectQueryBuilder<Shift> {
    return this.repo
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.location', 'location')
      .leftJoinAndSelect('shift.requiredSkill', 'skill')
      .leftJoinAndSelect('shift.assignments', 'assignment')
      .leftJoinAndSelect('assignment.user', 'assignedUser')
      .where('shift.deletedAt IS NULL');
  }

  async findAll(
    query: QueryShiftDto,
    caller?: User,
  ): Promise<[Shift[], number]> {
    const qb = this.baseQuery();

    if (caller?.role === Role.STAFF) {
      // Staff only see PUBLISHED shifts at locations they are certified at
      qb.andWhere('shift.status = :pubStatus', {
        pubStatus: ShiftStatus.PUBLISHED,
      });
      qb.innerJoin(
        'staff_locations',
        'slCaller',
        'slCaller.user_id = :callerId AND slCaller.is_active = true AND slCaller.location_id = shift.locationId',
        { callerId: caller.id },
      );
    } else if (caller?.role === Role.MANAGER) {
      // Managers only see shifts at their own certified locations
      qb.innerJoin(
        'staff_locations',
        'slCaller',
        'slCaller.user_id = :callerId AND slCaller.is_active = true AND slCaller.location_id = shift.locationId',
        { callerId: caller.id },
      );
    }

    if (query.locationId) {
      qb.andWhere('shift.locationId = :locationId', {
        locationId: query.locationId,
      });
    }

    if (query.status) {
      qb.andWhere('shift.status = :status', { status: query.status });
    }

    if (query.startDate) {
      qb.andWhere('shift.startTime >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }

    if (query.endDate) {
      qb.andWhere('shift.startTime <= :endDate', {
        endDate: new Date(query.endDate),
      });
    }

    if (query.userId) {
      qb.andWhere('assignment.userId = :userId', { userId: query.userId });
    }

    if (query.skillId) {
      qb.andWhere('shift.requiredSkillId = :skillId', {
        skillId: query.skillId,
      });
    }

    qb.orderBy('shift.startTime', 'ASC');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }

  async findById(id: string): Promise<Shift | null> {
    return this.baseQuery().andWhere('shift.id = :id', { id }).getOne();
  }

  async save(shift: Shift): Promise<Shift> {
    return this.repo.save(shift);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
