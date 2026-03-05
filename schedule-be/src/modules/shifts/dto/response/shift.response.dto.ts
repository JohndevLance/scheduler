import { Expose, Type, plainToInstance } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Shift } from '../../entities/shift.entity';
import { ShiftStatus } from '../../../../common/enums/shift-status.enum';

class AssignmentResponseDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() userId: string;
  @ApiProperty() @Expose() assignedById: string;
  @ApiProperty() @Expose() isSwapPending: boolean;
  @ApiPropertyOptional() @Expose() notes: string | null;
  @ApiProperty() @Expose() createdAt: Date;
}

class LocationSummaryDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() name: string;
  @ApiProperty() @Expose() timezone: string;
}

export class ShiftResponseDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() locationId: string;
  @ApiProperty({ type: () => LocationSummaryDto })
  @Expose()
  @Type(() => LocationSummaryDto)
  location: LocationSummaryDto;
  @ApiPropertyOptional() @Expose() requiredSkillId: string | null;
  @ApiProperty() @Expose() startTime: Date;
  @ApiProperty() @Expose() endTime: Date;
  @ApiProperty() @Expose() headcount: number;
  @ApiProperty({ enum: ShiftStatus }) @Expose() status: ShiftStatus;
  @ApiPropertyOptional() @Expose() notes: string | null;
  @ApiProperty() @Expose() isPremium: boolean;
  @ApiPropertyOptional() @Expose() publishedAt: Date | null;
  @ApiProperty() @Expose() createdAt: Date;
  @ApiProperty() @Expose() updatedAt: Date;

  @ApiProperty({ type: [AssignmentResponseDto] })
  @Expose()
  @Type(() => AssignmentResponseDto)
  assignments: AssignmentResponseDto[];

  static fromEntity(shift: Shift): ShiftResponseDto {
    return plainToInstance(ShiftResponseDto, shift, {
      excludeExtraneousValues: true,
    });
  }

  static fromEntities(shifts: Shift[]): ShiftResponseDto[] {
    return shifts.map(ShiftResponseDto.fromEntity);
  }
}
