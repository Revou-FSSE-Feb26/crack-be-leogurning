import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto.js';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @IsString()
  @IsOptional()
  @IsIn([
    'PENDING',
    'AWAITING_PAYMENT',
    'PAYMENT_UPLOADED',
    'PAYMENT_VERIFIED',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'PENDING_RESCHEDULE',
    'REJECTED_SCHEDULE',
  ])
  status?: string;

  @IsString()
  @IsOptional()
  meetingLink?: string;

  @IsString()
  @IsOptional()
  cancellationNotes?: string;

  @IsString()
  @IsOptional()
  @IsIn(['CLIENT', 'COUNSELOR', 'ADMIN'])
  cancelledBy?: string;
}
