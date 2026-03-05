import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignStaffDto {
  @ApiProperty({ format: 'uuid', description: 'Staff member to assign' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ example: 'Covering for Alex' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UnassignStaffDto {
  @ApiProperty({ format: 'uuid', description: 'Staff member to unassign' })
  @IsUUID()
  userId: string;
}
