import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from './entities/shift.entity';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { Availability } from '../users/entities/availability.entity';
import { AvailabilityException } from '../users/entities/availability-exception.entity';
import { ShiftsRepository } from './shifts.repository';
import { ConstraintService } from './constraint.service';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { UsersModule } from '../users/users.module';
import { LocationsModule } from '../locations/locations.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shift,
      ShiftAssignment,
      Availability,
      AvailabilityException,
    ]),
    UsersModule,
    LocationsModule,
    NotificationsModule,
  ],
  providers: [ShiftsRepository, ConstraintService, ShiftsService],
  controllers: [ShiftsController],
  exports: [ShiftsService, ConstraintService],
})
export class ShiftsModule {}
