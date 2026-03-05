import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from './entities/user.entity';
import { QueryUserDto } from './dto/request/query-user.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  get orm(): Repository<User> {
    return this.repo;
  }

  private baseQuery(): SelectQueryBuilder<User> {
    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.skills', 'skill')
      .leftJoinAndSelect('user.availabilities', 'availability')
      .leftJoinAndSelect('user.availabilityExceptions', 'exception')
      .where('user.deletedAt IS NULL');
  }

  async findAll(query: QueryUserDto, caller?: User): Promise<[User[], number]> {
    const qb = this.baseQuery();

    // Managers only see staff/managers at their own locations; never admins
    if (caller?.role === Role.MANAGER) {
      qb.andWhere('user.role != :adminRole', { adminRole: Role.ADMIN });
      qb.innerJoin(
        'staff_locations',
        'slcaller',
        `slcaller.user_id = :callerId
         AND slcaller."isActive" = true
         AND EXISTS (
           SELECT 1 FROM staff_locations sltarget
           WHERE sltarget.user_id = "user"."id"
             AND sltarget.location_id = slcaller.location_id
             AND sltarget."isActive" = true
         )`,
        { callerId: caller.id },
      );
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (query.skillId) {
      qb.andWhere('skill.id = :skillId', { skillId: query.skillId });
    }

    if (query.locationId) {
      qb.innerJoin(
        'staff_locations',
        'sl',
        'sl.user_id = user.id AND sl.location_id = :locationId AND sl.is_active = true',
        { locationId: query.locationId },
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }

  async canManagerSeeUser(
    managerId: string,
    targetUserId: string,
  ): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('u')
      .innerJoin(
        'staff_locations',
        'slM',
        'slM.user_id = :managerId AND slM.is_active = true',
        { managerId },
      )
      .innerJoin(
        'staff_locations',
        'slT',
        'slT.user_id = :targetUserId AND slT.location_id = slM.location_id AND slT.is_active = true',
        { targetUserId },
      )
      .where('u.id = :targetUserId', { targetUserId })
      .getCount();
    return count > 0;
  }

  async findById(id: string): Promise<User | null> {
    return this.baseQuery().andWhere('user.id = :id', { id }).getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.skills', 'skill')
      .where('user.email = :email', { email })
      .andWhere('user.deletedAt IS NULL')
      .getOne();
  }

  async findWithSkillAtLocation(
    locationId: string,
    skillName: string,
  ): Promise<User[]> {
    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.skills', 'skill')
      .innerJoin(
        'staff_locations',
        'sl',
        'sl.user_id = user.id AND sl.location_id = :locationId AND sl.is_active = true',
        { locationId },
      )
      .where('LOWER(skill.name) = LOWER(:skillName)', { skillName })
      .andWhere('user.isActive = true')
      .andWhere('user.deletedAt IS NULL')
      .getMany();
  }

  async save(user: User): Promise<User> {
    return this.repo.save(user);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
