import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SwapType } from '../../../../common/enums/swap-status.enum';

export class CreateSwapDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Shift the requester wants to swap/drop',
  })
  @IsUUID()
  shiftId: string;

  @ApiProperty({
    enum: SwapType,
    description: 'SWAP = exchange with specific person, DROP = open to anyone',
  })
  @IsEnum(SwapType)
  type: SwapType;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Target user for a direct SWAP (omit for DROP)',
  })
  @IsOptional()
  @IsUUID()
  coverId?: string;

  @ApiPropertyOptional({ example: 'Have a doctor appointment' })
  @IsOptional()
  @IsString()
  requesterNote?: string;
}
