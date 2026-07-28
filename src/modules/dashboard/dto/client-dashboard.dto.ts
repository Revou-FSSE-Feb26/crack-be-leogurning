import { ApiProperty } from '@nestjs/swagger';

class NextSessionDto {
  @ApiProperty({ description: 'Appointment ID' })
  id: string;

  @ApiProperty({ description: 'Counselor full name' })
  counselorName: string;

  @ApiProperty({ description: 'Appointment date (ISO)' })
  date: string;

  @ApiProperty({ description: 'Start time (HH:MM)' })
  time: string;

  @ApiProperty({ description: 'Session type' })
  sessionType: string;
}

export class ClientDashboardDto {
  @ApiProperty({ description: 'Number of upcoming appointments', example: 3 })
  upcomingCount: number;

  @ApiProperty({ description: 'Number of completed appointments', example: 12 })
  completedCount: number;

  @ApiProperty({
    description: 'Next upcoming session',
    nullable: true,
    type: NextSessionDto,
  })
  nextSession: NextSessionDto | null;
}
