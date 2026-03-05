import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveSwapDto {
  @ApiPropertyOptional({ example: 'Approved — please confirm handoff' })
  @IsOptional()
  @IsString()
  managerNote?: string;
}
