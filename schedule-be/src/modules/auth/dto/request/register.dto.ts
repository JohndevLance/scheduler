import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'Jane', description: 'First name' })
  @IsString()
  @Length(1, 100)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @Length(1, 100)
  lastName: string;

  @ApiProperty({
    example: 'jane@coastaleats.com',
    description: 'Email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'securePass1!',
    minLength: 8,
    description: 'Password (min 8 chars)',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    enum: Role,
    default: Role.STAFF,
    description: 'User role',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
