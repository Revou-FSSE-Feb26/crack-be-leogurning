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
import { SpecializationsService } from './specializations.service';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';

@ApiTags('specializations')
@Controller('specializations')
export class SpecializationsController {
  constructor(
    private readonly specializationsService: SpecializationsService,
  ) {}

  @Get()
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'List all specializations',
    description: 'Get all available specializations. Public endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Specializations retrieved successfully',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  async findAll() {
    return this.specializationsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ModerateThrottle()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a specialization',
    description: 'Create a new specialization. Admin only.',
  })
  @ApiResponse({
    status: 201,
    description: 'Specialization created successfully',
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
    status: 409,
    description: 'Conflict. Specialization with this name already exists.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  async create(
    @Body() dto: CreateSpecializationDto,
    @GetUser('id') userId: string,
  ) {
    return this.specializationsService.create({
      name: dto.name,
      description: dto.description,
      userId,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ModerateThrottle()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a specialization',
    description: 'Update an existing specialization. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Specialization updated successfully',
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
    description: 'Specialization not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Specialization with this name already exists.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSpecializationDto,
    @GetUser('id') userId: string,
  ) {
    return this.specializationsService.update(id, {
      name: dto.name,
      description: dto.description,
      userId,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ModerateThrottle()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a specialization',
    description: 'Delete an existing specialization. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Specialization deleted successfully',
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
    description: 'Specialization not found.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  async delete(@Param('id') id: string) {
    return this.specializationsService.delete(id);
  }
}
