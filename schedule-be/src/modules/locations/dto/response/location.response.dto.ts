import { Expose, plainToInstance } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Location } from '../../entities/location.entity';

export class LocationResponseDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() name: string;
  @ApiProperty() @Expose() address: string;
  @ApiProperty() @Expose() city: string;
  @ApiProperty() @Expose() state: string;
  @ApiProperty() @Expose() zipCode: string;
  @ApiProperty() @Expose() timezone: string;
  @ApiProperty() @Expose() isActive: boolean;
  @ApiPropertyOptional() @Expose() phone: string | null;
  @ApiProperty() @Expose() createdAt: Date;
  @ApiProperty() @Expose() updatedAt: Date;

  static fromEntity(location: Location): LocationResponseDto {
    return plainToInstance(LocationResponseDto, location, {
      excludeExtraneousValues: true,
    });
  }

  static fromEntities(locations: Location[]): LocationResponseDto[] {
    return locations.map(LocationResponseDto.fromEntity);
  }
}
