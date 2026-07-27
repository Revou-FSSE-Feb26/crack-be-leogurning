import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import {
  ModerateThrottle,
  RelaxedThrottle,
} from 'src/common/decorators/custom-throttler.decorator';
import { SessionTypesService } from './session-types.service';
import { CreateSessionTypeDto } from './dto/create-session-type.dto';
import { UpdateSessionTypeDto } from './dto/update-session-type.dto';

@ApiTags('session-types')
@Controller('session-types')
export class SessionTypesController {
  constructor(private readonly sessionTypesService: SessionTypesService) {}

  @Get()
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'List all session types',
    description: 'Get all available session types. Public endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session types retrieved successfully',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  async findAll() {
    return this.sessionTypesService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ModerateThrottle()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a session type',
    description: 'Create a new session type. Admin only.',
  })
  @ApiResponse({
    status: 201,
    description: 'Session type created successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Invalid or missing token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin role required.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  async create(
    @Body() dto: CreateSessionTypeDto,
    @GetUser('id') userId: string,
  ) {
    return this.sessionTypesService.create({
      name: dto.name,
      durationMinutes: dto.durationMinutes,
      price: dto.price,
      tier: dto.tier,
      isOnline: dto.isOnline,
      userId,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ModerateThrottle()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a session type',
    description: 'Update an existing session type. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session type updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Invalid or missing token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin role required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Session type not found.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSessionTypeDto,
    @GetUser('id') userId: string,
  ) {
    return this.sessionTypesService.update(id, {
      name: dto.name,
      durationMinutes: dto.durationMinutes,
      price: dto.price,
      tier: dto.tier,
      isOnline: dto.isOnline,
      userId,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ModerateThrottle()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a session type',
    description: 'Delete an existing session type. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session type deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Invalid or missing token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin role required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Session type not found.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  async delete(@Param('id') id: string) {
    return this.sessionTypesService.delete(id);
  }
}
