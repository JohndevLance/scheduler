import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'Jane', description: 'First name' })
  @IsString()
  @Length(1, 100)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @Length(1, 100)
  lastName: string;

  @ApiProperty({ example: 'jane@coastaleats.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePass1!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.STAFF })
  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.STAFF;

  @ApiPropertyOptional({
    example: 40,
    minimum: 0,
    maximum: 168,
    description: 'Target hours per week',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(168)
  desiredHoursPerWeek?: number;

  @ApiPropertyOptional({ example: '+15551234567' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;

  @ApiPropertyOptional({
    example: 'America/New_York',
    description: 'IANA timezone string',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  timezone?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'UUIDs of skills to assign',
  })
  @IsOptional()
  @IsString({ each: true })
  skillIds?: string[];

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description:
      'Location UUID to certify the new user into. Required when created by a manager.',
  })
  @IsOptional()
  @IsUUID()
  locationId?: string;
}
