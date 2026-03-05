import {
  IsEnum,
  IsInt,
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '../../../../common/enums/day-of-week.enum';

export class SetAvailabilityDto {
  @ApiProperty({
    enum: DayOfWeek,
    example: DayOfWeek.MONDAY,
    description: '0=Sun, 1=Mon … 6=Sat',
  })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: '09:00', description: 'HH:mm start time' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:00', description: 'HH:mm end time' })
  @IsString()
  endTime: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isAvailable: boolean;
}

export class SetAvailabilityBulkDto {
  @ApiProperty({ type: [SetAvailabilityDto] })
  @IsArray()
  availabilities: SetAvailabilityDto[];
}

export class CreateAvailabilityExceptionDto {
  @ApiProperty({
    example: '2025-07-04',
    description: 'ISO date string YYYY-MM-DD',
  })
  @IsString()
  date: string;

  @ApiProperty({
    example: true,
    description:
      'True means unavailable all day; set false to provide a window',
  })
  @IsBoolean()
  isUnavailableAllDay: boolean;

  @ApiPropertyOptional({
    example: '10:00',
    description: 'Required when isUnavailableAllDay is false',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '14:00' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ example: 'Doctor appointment' })
  @IsOptional()
  @IsString()
  reason?: string;
}
