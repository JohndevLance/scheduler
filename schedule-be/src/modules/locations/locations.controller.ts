import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/request/create-location.dto';
import { UpdateLocationDto } from './dto/request/update-location.dto';
import {
  CertifyStaffDto,
  DecertifyStaffDto,
} from './dto/request/certify-staff.dto';
import { LocationResponseDto } from './dto/response/location.response.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('locations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all locations' })
  async findAll() {
    const locations = await this.locationsService.findAll();
    return ApiResponseDto.success(LocationResponseDto.fromEntities(locations));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const location = await this.locationsService.findById(id);
    return ApiResponseDto.success(LocationResponseDto.fromEntity(location));
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new location (admin only)' })
  @ApiResponse({ status: 201, description: 'Location created' })
  async create(@Body() dto: CreateLocationDto) {
    const location = await this.locationsService.create(dto);
    return ApiResponseDto.success(
      LocationResponseDto.fromEntity(location),
      'Location created',
      HttpStatus.CREATED,
    );
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a location (admin only)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    const location = await this.locationsService.update(id, dto);
    return ApiResponseDto.success(LocationResponseDto.fromEntity(location));
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a location (admin only)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Location deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.locationsService.remove(id);
  }

  // ----- Staff Certifications -----

  @Get(':id/staff')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'List staff certified at this location' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Default true — only active certifications',
  })
  async getStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const result = await this.locationsService.getStaffForLocation(
      id,
      activeOnly !== 'false',
    );
    return ApiResponseDto.success(result);
  }

  @Post(':id/staff/certify')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Certify a staff member to work at this location' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async certifyStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CertifyStaffDto,
  ) {
    const result = await this.locationsService.certifyStaff(id, dto);
    return ApiResponseDto.success(result, 'Staff certified');
  }

  @Post(':id/staff/decertify')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: "Remove a staff member's certification for this location",
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async decertifyStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecertifyStaffDto,
  ) {
    const result = await this.locationsService.decertifyStaff(id, dto);
    return ApiResponseDto.success(result, 'Staff de-certified');
  }
}
