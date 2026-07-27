import { ApiProperty } from '@nestjs/swagger';

export class ScheduleSlotDto {
  @ApiProperty({ description: 'Schedule slot ID', example: 'uuid-here' })
  id: string;

  @ApiProperty({ description: 'Day of the week', example: 'MON' })
  dayOfWeek: string;

  @ApiProperty({ description: 'Start time', example: '09:00' })
  startTime: string;

  @ApiProperty({ description: 'End time', example: '10:00' })
  endTime: string;
}
