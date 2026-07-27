import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfirmAppointmentDto {
  @ApiPropertyOptional({
    description: 'Meeting link for online sessions',
    example: 'https://meet.google.com/abc-def-ghi',
  })
  @IsOptional()
  @IsString()
  meetingLink?: string;
}
