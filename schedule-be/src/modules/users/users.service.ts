import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { Skill } from './entities/skill.entity';
import { Availability } from './entities/availability.entity';
import { AvailabilityException } from './entities/availability-exception.entity';
import { StaffLocation } from '../locations/entities/staff-location.entity';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/request/create-user.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { QueryUserDto } from './dto/request/query-user.dto';
import { Role } from '../../common/enums/role.enum';
import {
  SetAvailabilityBulkDto,
  CreateAvailabilityExceptionDto,
} from './dto/request/availability.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(Availability)
    private readonly availabilityRepo: Repository<Availability>,
    @InjectRepository(AvailabilityException)
    private readonly exceptionRepo: Repository<AvailabilityException>,
    @InjectRepository(StaffLocation)
    private readonly staffLocationRepo: Repository<StaffLocation>,
  ) {}

  async findAll(query: QueryUserDto, caller?: User): Promise<[User[], number]> {
    return this.usersRepository.findAll(query, caller);
  }

  async findById(id: string, caller?: User): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    // Managers cannot see admin profiles or staff outside their locations
    if (caller?.role === Role.MANAGER) {
      if (user.role === Role.ADMIN)
        throw new NotFoundException(`User ${id} not found`);
      const canSee = await this.usersRepository.canManagerSeeUser(
        caller.id,
        id,
      );
      if (!canSee) throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async create(dto: CreateUserDto, caller?: User): Promise<User> {
    // Managers can only create staff/manager users for their own locations
    if (caller?.role === Role.MANAGER) {
      if (dto.role === Role.ADMIN) {
        throw new ForbiddenException('Managers cannot create admin users');
      }
      if (!dto.locationId) {
        throw new BadRequestException(
          'locationId is required when a manager creates a user',
        );
      }
      // Verify the manager is actually assigned to that location
      const managerCert = await this.staffLocationRepo.findOne({
        where: {
          userId: caller.id,
          locationId: dto.locationId,
          isActive: true,
        },
      });
      if (!managerCert) {
        throw new ForbiddenException(
          'You are not assigned to the specified location',
        );
      }
    }

    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.orm.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashed,
      role: dto.role,
      desiredHoursPerWeek: dto.desiredHoursPerWeek ?? null,
      phone: dto.phone ?? null,
      timezone: dto.timezone ?? 'UTC',
    });

    if (dto.skillIds?.length) {
      user.skills = await this.skillRepo.findByIds(dto.skillIds);
    }

    const saved = await this.usersRepository.save(user);

    // Auto-certify the new user to the specified location
    if (dto.locationId) {
      const cert = this.staffLocationRepo.create({
        userId: saved.id,
        locationId: dto.locationId,
        isActive: true,
        certifiedAt: new Date(),
      });
      await this.staffLocationRepo.save(cert);
    }

    return saved;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepository.findByEmail(dto.email);
      if (existing) throw new ConflictException('Email already in use');
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.skillIds !== undefined) {
      user.skills = dto.skillIds.length
        ? await this.skillRepo.findByIds(dto.skillIds)
        : [];
    }

    Object.assign(user, {
      ...(dto.firstName !== undefined && { firstName: dto.firstName }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.password !== undefined && { password: dto.password }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.desiredHoursPerWeek !== undefined && {
        desiredHoursPerWeek: dto.desiredHoursPerWeek,
      }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.timezone !== undefined && { timezone: dto.timezone }),
    });

    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id); // ensure exists
    await this.usersRepository.softDelete(id);
  }

  // ----- Availability -----

  async setAvailability(
    userId: string,
    dto: SetAvailabilityBulkDto,
  ): Promise<Availability[]> {
    await this.findById(userId);

    // Delete existing recurring availability for this user
    await this.availabilityRepo.delete({ userId });

    const entries = dto.availabilities.map((a) =>
      this.availabilityRepo.create({ ...a, userId }),
    );

    return this.availabilityRepo.save(entries);
  }

  async getAvailability(userId: string): Promise<Availability[]> {
    await this.findById(userId);
    return this.availabilityRepo.find({
      where: { userId },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async createAvailabilityException(
    userId: string,
    dto: CreateAvailabilityExceptionDto,
  ): Promise<AvailabilityException> {
    await this.findById(userId);
    const exception = this.exceptionRepo.create({ ...dto, userId });
    return this.exceptionRepo.save(exception);
  }

  async removeAvailabilityException(
    userId: string,
    exceptionId: string,
  ): Promise<void> {
    const exception = await this.exceptionRepo.findOne({
      where: { id: exceptionId, userId },
    });
    if (!exception)
      throw new NotFoundException('Availability exception not found');
    await this.exceptionRepo.remove(exception);
  }

  // ----- Skills (admin) -----

  async findAllSkills(): Promise<Skill[]> {
    return this.skillRepo.find({ order: { name: 'ASC' } });
  }

  async createSkill(name: string, description?: string): Promise<Skill> {
    const skill = this.skillRepo.create({ name, description });
    return this.skillRepo.save(skill);
  }
}
