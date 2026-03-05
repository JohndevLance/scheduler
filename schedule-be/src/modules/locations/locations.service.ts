import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { StaffLocation } from './entities/staff-location.entity';
import { CreateLocationDto } from './dto/request/create-location.dto';
import { UpdateLocationDto } from './dto/request/update-location.dto';
import {
  CertifyStaffDto,
  DecertifyStaffDto,
} from './dto/request/certify-staff.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
    @InjectRepository(StaffLocation)
    private readonly staffLocationRepo: Repository<StaffLocation>,
  ) {}

  async findAll(): Promise<Location[]> {
    return this.locationRepo
      .createQueryBuilder('location')
      .where('location.deletedAt IS NULL')
      .orderBy('location.name', 'ASC')
      .getMany();
  }

  async findById(id: string): Promise<Location> {
    const location = await this.locationRepo
      .createQueryBuilder('location')
      .where('location.id = :id', { id })
      .andWhere('location.deletedAt IS NULL')
      .getOne();
    if (!location) throw new NotFoundException(`Location ${id} not found`);
    return location;
  }

  async create(dto: CreateLocationDto): Promise<Location> {
    const location = this.locationRepo.create(dto);
    return this.locationRepo.save(location);
  }

  async update(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.findById(id);
    Object.assign(location, dto);
    return this.locationRepo.save(location);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.locationRepo.softDelete(id);
  }

  // ----- Certifications -----

  async certifyStaff(
    locationId: string,
    dto: CertifyStaffDto,
  ): Promise<StaffLocation> {
    await this.findById(locationId);

    const existing = await this.staffLocationRepo.findOne({
      where: { userId: dto.userId, locationId },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException(
          'Staff member is already certified for this location',
        );
      }
      // Re-certify
      existing.isActive = true;
      existing.certifiedAt = new Date();
      existing.decertifiedAt = null;
      existing.decertificationReason = null;
      return this.staffLocationRepo.save(existing);
    }

    const cert = this.staffLocationRepo.create({
      userId: dto.userId,
      locationId,
      isActive: true,
      certifiedAt: new Date(),
    });
    return this.staffLocationRepo.save(cert);
  }

  async decertifyStaff(
    locationId: string,
    dto: DecertifyStaffDto,
  ): Promise<StaffLocation> {
    await this.findById(locationId);

    const cert = await this.staffLocationRepo.findOne({
      where: { userId: dto.userId, locationId, isActive: true },
    });
    if (!cert) {
      throw new NotFoundException(
        'Active certification not found for this staff member',
      );
    }

    cert.isActive = false;
    cert.decertifiedAt = new Date();
    cert.decertificationReason = dto.reason ?? null;
    return this.staffLocationRepo.save(cert);
  }

  async getStaffForLocation(
    locationId: string,
    activeOnly = true,
  ): Promise<StaffLocation[]> {
    await this.findById(locationId);
    const query: any = { locationId };
    if (activeOnly) query.isActive = true;

    return this.staffLocationRepo.find({
      where: query,
      relations: ['user', 'user.skills'],
      order: { certifiedAt: 'DESC' },
    });
  }

  async getLocationsForUser(userId: string): Promise<StaffLocation[]> {
    return this.staffLocationRepo.find({
      where: { userId, isActive: true },
      relations: ['location'],
    });
  }

  async isStaffCertified(userId: string, locationId: string): Promise<boolean> {
    const cert = await this.staffLocationRepo.findOne({
      where: { userId, locationId, isActive: true },
    });
    return !!cert;
  }

  /**
   * Throws ForbiddenException if a manager is not certified at the given location.
   * Admins always pass. STAFF should not call location-management routes.
   */
  async assertCanAccessLocation(
    caller: User,
    locationId: string,
  ): Promise<void> {
    if (caller.role === Role.ADMIN) return;
    const certified = await this.isStaffCertified(caller.id, locationId);
    if (!certified) {
      throw new ForbiddenException('You do not have access to this location');
    }
  }
}
