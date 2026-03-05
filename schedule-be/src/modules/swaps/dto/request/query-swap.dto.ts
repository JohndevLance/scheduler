import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  SwapStatus,
  SwapType,
} from '../../../../common/enums/swap-status.enum';

export class QuerySwapDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SwapStatus })
  @IsOptional()
  @IsEnum(SwapStatus)
  status?: SwapStatus;

  @ApiPropertyOptional({ enum: SwapType })
  @IsOptional()
  @IsEnum(SwapType)
  type?: SwapType;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by requester' })
  @IsOptional()
  @IsUUID()
  requesterId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filter by location (via shift)',
  })
  @IsOptional()
  @IsUUID()
  locationId?: string;
}
