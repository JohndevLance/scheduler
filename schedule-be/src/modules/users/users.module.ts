import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Skill } from './entities/skill.entity';
import { Availability } from './entities/availability.entity';
import { AvailabilityException } from './entities/availability-exception.entity';
import { StaffLocation } from '../locations/entities/staff-location.entity';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Skill,
      Availability,
      AvailabilityException,
      StaffLocation,
    ]),
  ],
  providers: [UsersRepository, UsersService],
  controllers: [UsersController],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
