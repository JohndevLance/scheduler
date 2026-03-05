import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShiftDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Location where shift takes place',
  })
  @IsUUID()
  locationId: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Skill required for this shift',
  })
  @IsOptional()
  @IsUUID()
  requiredSkillId?: string;

  @ApiProperty({
    example: '2025-07-15T17:00:00Z',
    description: 'ISO 8601 UTC datetime',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    example: '2025-07-16T01:00:00Z',
    description: 'ISO 8601 UTC datetime',
  })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({
    example: 2,
    minimum: 1,
    default: 1,
    description: 'Number of staff slots',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  headcount?: number = 1;

  @ApiPropertyOptional({ example: 'Busy Friday dinner service' })
  @IsOptional()
  @IsString()
  notes?: string;
}
