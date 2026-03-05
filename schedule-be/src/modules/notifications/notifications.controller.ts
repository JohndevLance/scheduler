import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/request/query-notification.dto';
import { NotificationResponseDto } from './dto/response/notification.response.dto';
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for the current user' })
  async findAll(
    @CurrentUser() user: User,
    @Query() query: QueryNotificationDto,
  ) {
    const [items, total] = await this.notificationsService.getForUser(
      user.id,
      query,
    );
    return ApiResponseDto.success(
      PaginatedResponseDto.of(
        NotificationResponseDto.fromEntities(items),
        total,
        query.page ?? 1,
        query.limit ?? 20,
      ),
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications' })
  async unreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.unreadCount(user.id);
    return ApiResponseDto.success({ count });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const notif = await this.notificationsService.markRead(id, user.id);
    return ApiResponseDto.success(NotificationResponseDto.fromEntity(notif));
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser() user: User) {
    const result = await this.notificationsService.markAllRead(user.id);
    return ApiResponseDto.success(
      result,
      `${result.updated} notifications marked read`,
    );
  }
}
