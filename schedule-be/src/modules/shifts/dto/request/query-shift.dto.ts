import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftStatus } from '../../../../common/enums/shift-status.enum';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class QueryShiftDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by location' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({
    example: '2025-07-01',
    description: 'ISO date — inclusive lower bound',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2025-07-31',
    description: 'ISO date — inclusive upper bound',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: ShiftStatus,
    description: 'Filter by shift status',
  })
  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filter shifts assigned to this user',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filter shifts requiring this skill',
  })
  @IsOptional()
  @IsUUID()
  skillId?: string;
}
