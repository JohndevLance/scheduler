import { Expose, plainToInstance } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Notification } from '../../entities/notification.entity';
import { NotificationType } from '../../../../common/enums/notification-type.enum';

export class NotificationResponseDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() userId: string;
  @ApiProperty({ enum: NotificationType }) @Expose() type: NotificationType;
  @ApiProperty() @Expose() title: string;
  @ApiProperty() @Expose() body: string;
  @ApiPropertyOptional() @Expose() referenceId: string | null;
  @ApiPropertyOptional() @Expose() referenceType: string | null;
  @ApiProperty() @Expose() isRead: boolean;
  @ApiPropertyOptional() @Expose() readAt: Date | null;
  @ApiProperty() @Expose() createdAt: Date;

  static fromEntity(n: Notification): NotificationResponseDto {
    return plainToInstance(NotificationResponseDto, n, {
      excludeExtraneousValues: true,
    });
  }

  static fromEntities(ns: Notification[]): NotificationResponseDto[] {
    return ns.map(NotificationResponseDto.fromEntity);
  }
}
