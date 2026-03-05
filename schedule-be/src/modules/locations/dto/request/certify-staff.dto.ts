import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CertifyStaffDto {
  @ApiProperty({ format: 'uuid', description: 'User ID to certify' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ example: 'Completed orientation on 2025-06-01' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class DecertifyStaffDto {
  @ApiProperty({ format: 'uuid', description: 'User ID to de-certify' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ example: 'Transferred to another location' })
  @IsOptional()
  @IsString()
  reason?: string;
}
