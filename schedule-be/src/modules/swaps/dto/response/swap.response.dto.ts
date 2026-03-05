import { Expose, Type, plainToInstance } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SwapRequest } from '../../entities/swap-request.entity';
import {
  SwapStatus,
  SwapType,
} from '../../../../common/enums/swap-status.enum';

export class SwapResponseDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() shiftId: string;
  @ApiProperty() @Expose() requesterId: string;
  @ApiPropertyOptional() @Expose() coverId: string | null;
  @ApiProperty({ enum: SwapType }) @Expose() type: SwapType;
  @ApiProperty({ enum: SwapStatus }) @Expose() status: SwapStatus;
  @ApiPropertyOptional() @Expose() requesterNote: string | null;
  @ApiPropertyOptional() @Expose() managerNote: string | null;
  @ApiPropertyOptional() @Expose() resolvedById: string | null;
  @ApiPropertyOptional() @Expose() resolvedAt: Date | null;
  @ApiPropertyOptional() @Expose() expiresAt: Date | null;
  @ApiProperty() @Expose() createdAt: Date;
  @ApiProperty() @Expose() updatedAt: Date;

  static fromEntity(swap: SwapRequest): SwapResponseDto {
    return plainToInstance(SwapResponseDto, swap, {
      excludeExtraneousValues: true,
    });
  }

  static fromEntities(swaps: SwapRequest[]): SwapResponseDto[] {
    return swaps.map(SwapResponseDto.fromEntity);
  }
}
