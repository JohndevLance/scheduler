import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwapsService } from './swaps.service';
import { SwapsController } from './swaps.controller';
import { SwapRequest } from './entities/swap-request.entity';
import { ShiftAssignment } from '../shifts/entities/shift-assignment.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { ShiftsModule } from '../shifts/shifts.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SwapRequest, ShiftAssignment, Shift]),
    ShiftsModule,
    LocationsModule,
  ],
  controllers: [SwapsController],
  providers: [SwapsService],
  exports: [SwapsService],
})
export class SwapsModule {}
