import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { startOfDayUTC } from '../../common/utils/date.utils';
import { LocationsService } from '../locations/locations.service';

@ApiTags('schedules')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly locationsService: LocationsService,
  ) {}

  @Get('my/week')
  @ApiOperation({ summary: "Get the current user's personal weekly schedule" })
  @ApiQuery({ name: 'start', required: true, example: '2026-03-09' })
  async getMySchedule(
    @CurrentUser() user: User,
    @Query('start') start: string,
  ) {
    const weekStart = startOfDayUTC(new Date(start));
    const shifts = await this.schedulesService.getMySchedule(
      user.id,
      weekStart,
    );
    return ApiResponseDto.success(shifts);
  }

  @Get(':locationId/week')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Get weekly schedule for a location grouped by day',
  })
  @ApiParam({ name: 'locationId', type: String, format: 'uuid' })
  @ApiQuery({
    name: 'start',
    required: true,
    example: '2026-03-09',
    description: 'ISO date — start of week (Monday)',
  })
  async getWeeklySchedule(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Query('start') start: string,
    @CurrentUser() caller: User,
  ) {
    await this.locationsService.assertCanAccessLocation(caller, locationId);
    const weekStart = startOfDayUTC(new Date(start));
    const schedule = await this.schedulesService.getWeeklySchedule(
      locationId,
      weekStart,
    );
    return ApiResponseDto.success(schedule);
  }

  @Get(':locationId/week/export')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Export published shifts for the week as flat array (suitable for CSV)',
  })
  @ApiParam({ name: 'locationId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'start', required: true, example: '2026-03-09' })
  async exportSchedule(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Query('start') start: string,
    @CurrentUser() caller: User,
  ) {
    await this.locationsService.assertCanAccessLocation(caller, locationId);
    const weekStart = startOfDayUTC(new Date(start));
    const data = await this.schedulesService.exportSchedule(
      locationId,
      weekStart,
    );
    return ApiResponseDto.success(data);
  }
}
