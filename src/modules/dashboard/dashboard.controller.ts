import { Controller, Get, UseGuards } from '@nestjs/common';
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
import { RelaxedThrottle } from 'src/common/decorators/custom-throttler.decorator';
import { DashboardService } from './dashboard.service';
import { ClientDashboardDto } from './dto/client-dashboard.dto';
import { CounselorDashboardDto } from './dto/counselor-dashboard.dto';
import { AdminDashboardDto } from './dto/admin-dashboard.dto';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('client')
  @Roles(Role.CLIENT)
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'Get client dashboard',
    description: 'Returns dashboard statistics for the authenticated client',
  })
  @ApiResponse({
    status: 200,
    description: 'Client dashboard data',
    type: ClientDashboardDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Client role required' })
  async clientDashboard(
    @GetUser('id') userId: string,
  ): Promise<ClientDashboardDto> {
    return this.dashboardService.clientDashboard(userId);
  }

  @Get('counselor')
  @Roles(Role.COUNSELOR)
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'Get counselor dashboard',
    description:
      'Returns dashboard statistics for the authenticated counselor',
  })
  @ApiResponse({
    status: 200,
    description: 'Counselor dashboard data',
    type: CounselorDashboardDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Counselor role required',
  })
  async counselorDashboard(
    @GetUser('id') userId: string,
  ): Promise<CounselorDashboardDto> {
    return this.dashboardService.counselorDashboard(userId);
  }

  @Get('admin')
  @Roles(Role.ADMIN)
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'Get admin dashboard',
    description: 'Returns dashboard statistics for admin users',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin dashboard data',
    type: AdminDashboardDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async adminDashboard(): Promise<AdminDashboardDto> {
    return this.dashboardService.adminDashboard();
  }
}
