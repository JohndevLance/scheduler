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
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/request/create-user.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { QueryUserDto } from './dto/request/query-user.dto';
import {
  CreateAvailabilityExceptionDto,
  SetAvailabilityBulkDto,
} from './dto/request/availability.dto';
import { UserResponseDto } from './dto/response/user.response.dto';
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from './entities/user.entity';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'List all users (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  async findAll(@Query() query: QueryUserDto, @CurrentUser() caller: User) {
    const [users, total] = await this.usersService.findAll(query, caller);
    return ApiResponseDto.success(
      PaginatedResponseDto.of(
        UserResponseDto.fromEntities(users),
        total,
        query.page ?? 1,
        query.limit ?? 20,
      ),
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  async getMe(@CurrentUser() user: User) {
    const full = await this.usersService.findById(user.id);
    return ApiResponseDto.success(UserResponseDto.fromEntity(full));
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: User,
  ) {
    const user = await this.usersService.findById(id, caller);
    return ApiResponseDto.success(UserResponseDto.fromEntity(user));
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Create a new user. Managers must supply locationId and cannot create admins.',
  })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() caller: User) {
    const user = await this.usersService.create(dto, caller);
    return ApiResponseDto.success(
      UserResponseDto.fromEntity(user),
      'User created',
      HttpStatus.CREATED,
    );
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, dto);
    return ApiResponseDto.success(UserResponseDto.fromEntity(user));
  }

  @Patch('me/profile')
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    // Staff can only update their own non-role fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role, isActive, ...safeFields } = dto;
    const updated = await this.usersService.update(user.id, safeFields);
    return ApiResponseDto.success(UserResponseDto.fromEntity(updated));
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user (admin only)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.remove(id);
  }

  // ----- Availability -----

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get recurring weekly availability for a user' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async getAvailability(@Param('id', ParseUUIDPipe) id: string) {
    const entries = await this.usersService.getAvailability(id);
    return ApiResponseDto.success(entries);
  }

  @Post(':id/availability')
  @ApiOperation({
    summary: 'Set recurring weekly availability for a user (replaces existing)',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async setAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetAvailabilityBulkDto,
  ) {
    const entries = await this.usersService.setAvailability(id, dto);
    return ApiResponseDto.success(entries);
  }

  @Post(':id/availability/exceptions')
  @ApiOperation({
    summary: 'Add a one-off availability exception for a specific date',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async createException(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAvailabilityExceptionDto,
  ) {
    const exception = await this.usersService.createAvailabilityException(
      id,
      dto,
    );
    return ApiResponseDto.success(exception);
  }

  @Delete(':id/availability/exceptions/:exceptionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeException(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('exceptionId', ParseUUIDPipe) exceptionId: string,
  ) {
    await this.usersService.removeAvailabilityException(id, exceptionId);
  }

  // ----- Skills -----

  @Get('skills/all')
  @ApiOperation({ summary: 'List all available skills' })
  async getSkills() {
    const skills = await this.usersService.findAllSkills();
    return ApiResponseDto.success(skills);
  }

  @Post('skills')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new skill (admin only)' })
  async createSkill(@Body() body: { name: string; description?: string }) {
    const skill = await this.usersService.createSkill(
      body.name,
      body.description,
    );
    return ApiResponseDto.success(skill, 'Skill created', HttpStatus.CREATED);
  }
}
