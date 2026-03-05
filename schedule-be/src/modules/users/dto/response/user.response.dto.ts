import { plainToInstance, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../../common/enums/role.enum';
import { User } from '../../entities/user.entity';

export class SkillResponseDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() name: string;
  @ApiPropertyOptional() @Expose() description: string | null;
}

export class AvailabilityResponseDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() dayOfWeek: number;
  @ApiProperty() @Expose() startTime: string;
  @ApiProperty() @Expose() endTime: string;
  @ApiProperty() @Expose() isAvailable: boolean;
}

export class AvailabilityExceptionResponseDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() date: string;
  @ApiProperty() @Expose() isUnavailableAllDay: boolean;
  @ApiPropertyOptional() @Expose() startTime: string | null;
  @ApiPropertyOptional() @Expose() endTime: string | null;
  @ApiPropertyOptional() @Expose() reason: string | null;
}

export class UserResponseDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() firstName: string;
  @ApiProperty() @Expose() lastName: string;
  @ApiProperty() @Expose() email: string;
  @ApiProperty({ enum: Role }) @Expose() role: Role;
  @ApiProperty() @Expose() isActive: boolean;
  @ApiPropertyOptional() @Expose() desiredHoursPerWeek: number | null;
  @ApiPropertyOptional() @Expose() phone: string | null;
  @ApiProperty() @Expose() timezone: string;
  @ApiProperty() @Expose() createdAt: Date;
  @ApiProperty() @Expose() updatedAt: Date;

  @ApiProperty({ type: [SkillResponseDto] })
  @Expose()
  @Type(() => SkillResponseDto)
  skills: SkillResponseDto[];

  @ApiProperty({ type: [AvailabilityResponseDto] })
  @Expose()
  @Type(() => AvailabilityResponseDto)
  availabilities: AvailabilityResponseDto[];

  @ApiProperty({ type: [AvailabilityExceptionResponseDto] })
  @Expose()
  @Type(() => AvailabilityExceptionResponseDto)
  availabilityExceptions: AvailabilityExceptionResponseDto[];

  static fromEntity(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  static fromEntities(users: User[]): UserResponseDto[] {
    return users.map(UserResponseDto.fromEntity);
  }
}
