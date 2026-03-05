import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/request/create-shift.dto';
import { UpdateShiftDto } from './dto/request/update-shift.dto';
import { QueryShiftDto } from './dto/request/query-shift.dto';
import {
  AssignStaffDto,
  UnassignStaffDto,
} from './dto/request/assign-shift.dto';
import { ShiftResponseDto } from './dto/response/shift.response.dto';
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('shifts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  @ApiOperation({
    summary:
      'List shifts (filterable by location, date range, status, user, skill)',
  })
  async findAll(@Query() query: QueryShiftDto, @CurrentUser() caller: User) {
    const [shifts, total] = await this.shiftsService.findAll(query, caller);
    return ApiResponseDto.success(
      PaginatedResponseDto.of(
        ShiftResponseDto.fromEntities(shifts),
        total,
        query.page ?? 1,
        query.limit ?? 20,
      ),
    );
  }

  @Get('my/schedule')
  @ApiOperation({ summary: 'Get shifts assigned to the current user' })
  async mySchedule(@CurrentUser() user: User, @Query() query: QueryShiftDto) {
    const shifts = await this.shiftsService.getAssignmentsForUser(
      user.id,
      query,
    );
    return ApiResponseDto.success(ShiftResponseDto.fromEntities(shifts));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shift by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: User,
  ) {
    const shift = await this.shiftsService.findById(id, caller);
    return ApiResponseDto.success(ShiftResponseDto.fromEntity(shift));
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new shift' })
  @ApiResponse({ status: 201, description: 'Shift created in DRAFT status' })
  async create(@Body() dto: CreateShiftDto, @CurrentUser() user: User) {
    const shift = await this.shiftsService.create(dto, user);
    return ApiResponseDto.success(
      ShiftResponseDto.fromEntity(shift),
      'Shift created',
      HttpStatus.CREATED,
    );
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Update a shift (blocked within 48h of start if published)',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShiftDto,
    @CurrentUser() user: User,
  ) {
    const shift = await this.shiftsService.update(id, dto, user);
    return ApiResponseDto.success(ShiftResponseDto.fromEntity(shift));
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (soft) a shift' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Shift deleted' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.shiftsService.remove(id, user);
  }

  // ── Publish / Unpublish ──────────────────────────────────────────────────

  @Post(':id/publish')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Publish a shift (makes it visible to staff)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const shift = await this.shiftsService.publish(id, user);
    return ApiResponseDto.success(
      ShiftResponseDto.fromEntity(shift),
      'Shift published',
    );
  }

  @Post(':id/unpublish')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Unpublish a shift (blocked within 48h cutoff)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async unpublish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const shift = await this.shiftsService.unpublish(id, user);
    return ApiResponseDto.success(
      ShiftResponseDto.fromEntity(shift),
      'Shift unpublished',
    );
  }

  // ── Assignments ──────────────────────────────────────────────────────────

  @Post(':id/assign')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Assign a staff member to a shift',
    description:
      'Runs full constraint checks (certification, skill, double-booking, 10h rest, availability, overtime). ' +
      'Add `?override=true` to bypass soft warnings (not hard limits). ' +
      'Returns violations and suggestions if constraints are violated.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiQuery({
    name: 'override',
    required: false,
    type: Boolean,
    description: 'Manager override flag for soft warnings',
  })
  @ApiResponse({
    status: 200,
    description: 'Staff assigned (may include warnings array)',
  })
  @ApiResponse({
    status: 400,
    description: 'Constraint violation — violations and suggestions returned',
  })
  async assignStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignStaffDto,
    @CurrentUser() user: User,
    @Query('override') override?: string,
  ) {
    const managerOverride = override === 'true';
    const result = await this.shiftsService.assignStaff(
      id,
      dto,
      user,
      managerOverride,
    );
    return ApiResponseDto.success(
      result,
      result.warnings.length ? 'Assigned with warnings' : 'Staff assigned',
    );
  }

  @Delete(':id/assign/:userId')
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a staff member from a shift' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Shift ID',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    format: 'uuid',
    description: 'User ID to unassign',
  })
  @ApiResponse({ status: 204, description: 'Staff unassigned' })
  async unassignStaff(
    @Param('id', ParseUUIDPipe) shiftId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ) {
    await this.shiftsService.unassignStaff(shiftId, userId, user);
  }
}
