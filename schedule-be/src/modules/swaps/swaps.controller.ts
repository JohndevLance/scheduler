import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SwapsService } from './swaps.service';
import { CreateSwapDto } from './dto/request/create-swap.dto';
import { ResolveSwapDto } from './dto/request/resolve-swap.dto';
import { QuerySwapDto } from './dto/request/query-swap.dto';
import { SwapResponseDto } from './dto/response/swap.response.dto';
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

@ApiTags('swaps')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('swaps')
export class SwapsController {
  constructor(private readonly swapsService: SwapsService) {}

  @Get('eligible-covers/:shiftId')
  @ApiOperation({
    summary:
      'List colleagues eligible to cover a shift (certified, not already assigned). ' +
      'Returns canCover flag and any constraint violations per person.',
  })
  @ApiParam({ name: 'shiftId', type: String, format: 'uuid' })
  async eligibleCovers(
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @CurrentUser() user: User,
  ) {
    const covers = await this.swapsService.getEligibleCovers(
      shiftId,
      user.id,
    );
    return ApiResponseDto.success(covers);
  }

  @Get()
  @ApiOperation({
    summary: 'List swap requests (managers see all; staff see own)',
  })
  async findAll(@Query() query: QuerySwapDto, @CurrentUser() user: User) {
    const [swaps, total] = await this.swapsService.findAll(query, user);
    return ApiResponseDto.success(
      PaginatedResponseDto.of(
        SwapResponseDto.fromEntities(swaps),
        total,
        query.page ?? 1,
        query.limit ?? 20,
      ),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get swap request by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: User,
  ) {
    const swap = await this.swapsService.findById(id, caller);
    return ApiResponseDto.success(SwapResponseDto.fromEntity(swap));
  }

  @Post()
  @ApiOperation({
    summary: 'Create a swap or drop request for a shift you are assigned to',
    description:
      'For SWAP with a coverId: runs constraint checks on the cover person. ' +
      'Returns 400 with violations array if constraints are violated.',
  })
  @ApiResponse({ status: 201, description: 'Swap request created' })
  @ApiResponse({ status: 400, description: 'Constraint violation on cover person' })
  async create(@Body() dto: CreateSwapDto, @CurrentUser() user: User) {
    const result = await this.swapsService.createSwapRequest(dto, user);
    return ApiResponseDto.success(
      { swap: SwapResponseDto.fromEntity(result.swap), violations: result.violations },
      result.violations.length ? 'Swap request created with warnings' : 'Swap request created',
      HttpStatus.CREATED,
    );
  }

  @Post(':id/accept')
  @ApiOperation({
    summary: 'Accept a swap request as the cover person',
    description: 'Runs constraint checks on the accepting user. Returns 400 if constraints are violated.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.swapsService.acceptSwap(id, user);
    return ApiResponseDto.success(
      { swap: SwapResponseDto.fromEntity(result.swap), violations: result.violations },
      'Swap accepted — pending manager approval',
    );
  }

  @Post(':id/approve')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Approve a swap request (manager) — transfers the assignment',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveSwapDto,
    @CurrentUser() user: User,
  ) {
    const swap = await this.swapsService.approveRequest(id, user, dto);
    return ApiResponseDto.success(
      SwapResponseDto.fromEntity(swap),
      'Swap approved',
    );
  }

  @Post(':id/deny')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Deny a swap request (manager)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async deny(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveSwapDto,
    @CurrentUser() user: User,
  ) {
    const swap = await this.swapsService.denyRequest(id, user, dto);
    return ApiResponseDto.success(
      SwapResponseDto.fromEntity(swap),
      'Swap denied',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a swap request (requester or manager)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Cancelled' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.swapsService.cancelRequest(id, user);
  }
}
