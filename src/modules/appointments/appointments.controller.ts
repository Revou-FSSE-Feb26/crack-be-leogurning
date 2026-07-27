import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { ConfirmAppointmentDto } from './dto/confirm-appointment.dto';
import { ConfirmRescheduleDto } from './dto/confirm-reschedule.dto';
import { RejectRescheduleDto } from './dto/reject-reschedule.dto';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(Role.CLIENT)
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Create appointment',
    description: 'Client creates a new appointment',
  })
  @ApiResponse({ status: 201, description: 'Appointment created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Client role required' })
  async create(
    @GetUser('id') userId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(userId, dto);
  }

  @Get()
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'List appointments',
    description: 'Get paginated appointments filtered by role',
  })
  @ApiResponse({ status: 200, description: 'Appointments retrieved' })
  async findAll(@GetUser() user: any, @Query() query: QueryAppointmentsDto) {
    return this.appointmentsService.findAll(user, query);
  }

  @Get(':id')
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'Get appointment detail',
    description: 'Get single appointment with related data',
  })
  @ApiResponse({ status: 200, description: 'Appointment retrieved' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async findOne(@GetUser() user: any, @Param('id') id: string) {
    return this.appointmentsService.findOne(user, id);
  }

  @Patch(':id')
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Update appointment',
    description: 'General update (notes, meetingLink)',
  })
  @ApiResponse({ status: 200, description: 'Appointment updated' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Patch(':id/confirm')
  @Roles(Role.COUNSELOR)
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Confirm appointment',
    description: 'Counselor confirms the appointment',
  })
  @ApiResponse({ status: 200, description: 'Appointment confirmed' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async confirm(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ConfirmAppointmentDto,
  ) {
    return this.appointmentsService.confirm(userId, id, dto);
  }

  @Patch(':id/cancel')
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Cancel appointment',
    description: 'Cancel an appointment',
  })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.appointmentsService.cancel(id, dto);
  }

  @Patch(':id/reschedule')
  @Roles(Role.CLIENT)
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Reschedule appointment',
    description: 'Client requests reschedule',
  })
  @ApiResponse({ status: 200, description: 'Reschedule requested' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async reschedule(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(userId, id, dto);
  }

  @Patch(':id/start')
  @Roles(Role.COUNSELOR)
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Start session',
    description: 'Counselor starts the session',
  })
  @ApiResponse({ status: 200, description: 'Session started' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async start(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.appointmentsService.start(userId, id);
  }

  @Patch(':id/complete')
  @Roles(Role.COUNSELOR)
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Complete session',
    description: 'Counselor completes the session',
  })
  @ApiResponse({ status: 200, description: 'Session completed' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async complete(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.appointmentsService.complete(userId, id);
  }

  @Patch(':id/confirm-reschedule')
  @Roles(Role.COUNSELOR)
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Confirm reschedule',
    description: 'Counselor confirms the reschedule',
  })
  @ApiResponse({ status: 200, description: 'Reschedule confirmed' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async confirmReschedule(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ConfirmRescheduleDto,
  ) {
    return this.appointmentsService.confirmReschedule(userId, id, dto);
  }

  @Patch(':id/reject-reschedule')
  @Roles(Role.COUNSELOR)
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Reject reschedule',
    description: 'Counselor rejects the reschedule',
  })
  @ApiResponse({ status: 200, description: 'Reschedule rejected' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async rejectReschedule(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RejectRescheduleDto,
  ) {
    return this.appointmentsService.rejectReschedule(userId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Delete appointment',
    description: 'Admin deletes an appointment',
  })
  @ApiResponse({ status: 200, description: 'Appointment deleted' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
