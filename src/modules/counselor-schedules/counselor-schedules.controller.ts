import {
  Body,
  Controller,
  Get,
  Param,
  Put,
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
  RelaxedThrottle,
  ModerateThrottle,
} from 'src/common/decorators/custom-throttler.decorator';
import { CounselorSchedulesService } from './counselor-schedules.service';
import { BulkReplaceScheduleDto } from './dto/bulk-replace-schedule.dto';
import { ScheduleSlotDto } from './dto/schedule-slot-response.dto';

@ApiTags('counselor-schedules')
@Controller('counselor-schedules')
export class CounselorSchedulesController {
  constructor(
    private readonly counselorSchedulesService: CounselorSchedulesService,
  ) {}

  @Get(':counselorId')
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'Get counselor weekly schedule',
    description: 'Retrieve a counselor\'s weekly schedule by their counselor ID. Public endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Counselor schedule retrieved successfully',
  })
  async findByCounselor(
    @Param('counselorId') counselorId: string,
  ): Promise<{ data: ScheduleSlotDto[] }> {
    return this.counselorSchedulesService.findByCounselor(counselorId);
  }

  @Put(':counselorId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COUNSELOR)
  @ModerateThrottle()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Bulk replace counselor schedule',
    description: 'Replace all schedule slots for the authenticated counselor. Counselor only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Schedule replaced successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid time range' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
  async bulkReplace(
    @Param('counselorId') counselorId: string,
    @GetUser('id') userId: string,
    @Body() dto: BulkReplaceScheduleDto,
  ): Promise<{ success: boolean; message: string; data: ScheduleSlotDto[] }> {
    return this.counselorSchedulesService.bulkReplace(counselorId, userId, dto);
  }
}
