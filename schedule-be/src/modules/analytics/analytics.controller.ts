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
import { AnalyticsService } from './analytics.service';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { LocationsService } from '../locations/locations.service';

@ApiTags('analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly locationsService: LocationsService,
  ) {}

  @Get(':locationId/overtime-summary')
  @ApiOperation({
    summary: 'Scheduled hours per staff member for the given week',
  })
  @ApiParam({ name: 'locationId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'weekStart', required: true, example: '2026-03-09' })
  async overtimeSummary(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Query('weekStart') weekStart: string,
    @CurrentUser() caller: User,
  ) {
    await this.locationsService.assertCanAccessLocation(caller, locationId);
    const data = await this.analyticsService.getOvertimeSummary(
      locationId,
      new Date(weekStart),
    );
    return ApiResponseDto.success(data);
  }

  @Get(':locationId/overtime-alerts')
  @ApiOperation({
    summary: 'Staff at risk of overtime (≥35 h this week) with upcoming shifts',
  })
  @ApiParam({ name: 'locationId', type: String, format: 'uuid' })
  async overtimeAlerts(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @CurrentUser() caller: User,
  ) {
    await this.locationsService.assertCanAccessLocation(caller, locationId);
    const data = await this.analyticsService.getOvertimeAlerts(locationId);
    return ApiResponseDto.success(data);
  }

  @Get(':locationId/labor-cost')
  @ApiOperation({
    summary: 'Regular vs premium hours per staff member for a date range',
  })
  @ApiParam({ name: 'locationId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-03-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-03-31' })
  async laborCost(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() caller: User,
  ) {
    await this.locationsService.assertCanAccessLocation(caller, locationId);
    const data = await this.analyticsService.getLaborCostReport(
      locationId,
      new Date(startDate),
      new Date(endDate),
    );
    return ApiResponseDto.success(data);
  }

  @Get(':locationId/coverage')
  @ApiOperation({
    summary: 'Understaffed-shift coverage report grouped by day',
  })
  @ApiParam({ name: 'locationId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'weekStart', required: true, example: '2026-03-09' })
  async coverage(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Query('weekStart') weekStart: string,
    @CurrentUser() caller: User,
  ) {
    await this.locationsService.assertCanAccessLocation(caller, locationId);
    const data = await this.analyticsService.getCoverageReport(
      locationId,
      new Date(weekStart),
    );
    return ApiResponseDto.success(data);
  }

  @Get(':locationId/utilization')
  @ApiOperation({
    summary: 'Percentage of fully-staffed published shifts for the week',
  })
  @ApiParam({ name: 'locationId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'weekStart', required: true, example: '2026-03-09' })
  async utilization(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Query('weekStart') weekStart: string,
    @CurrentUser() caller: User,
  ) {
    await this.locationsService.assertCanAccessLocation(caller, locationId);
    const data = await this.analyticsService.getUtilizationReport(
      locationId,
      new Date(weekStart),
    );
    return ApiResponseDto.success(data);
  }
}
