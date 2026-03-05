import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty({ example: 'Downtown Coastal Eats' })
  @IsString()
  @Length(1, 150)
  name: string;

  @ApiProperty({ example: '123 Ocean Drive' })
  @IsString()
  @Length(1, 255)
  address: string;

  @ApiProperty({ example: 'Miami' })
  @IsString()
  @Length(1, 100)
  city: string;

  @ApiProperty({ example: 'FL' })
  @IsString()
  @Length(1, 100)
  state: string;

  @ApiProperty({ example: '33101' })
  @IsString()
  @Length(1, 20)
  zipCode: string;

  @ApiProperty({
    example: 'America/New_York',
    description: 'IANA timezone string',
  })
  @IsString()
  @Length(1, 60)
  timezone: string;

  @ApiPropertyOptional({ example: '+13051234567' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;
}
