import { ApiProperty } from '@nestjs/swagger';

export class ScheduleSlotDto {
  @ApiProperty({ description: 'Schedule slot ID', example: 'uuid-here' })
  id: string;

  @ApiProperty({ description: 'Day of the week', example: 'MON' })
  dayOfWeek: string;

  @ApiProperty({ description: 'Start time in HH:MM format', example: '09:00' })
  startTime: string;

  @ApiProperty({ description: 'End time in HH:MM format', example: '10:00' })
  endTime: string;
}
