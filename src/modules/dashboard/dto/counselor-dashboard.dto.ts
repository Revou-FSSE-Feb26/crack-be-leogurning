import { ApiProperty } from '@nestjs/swagger';

export class CounselorDashboardDto {
  @ApiProperty({ description: 'Number of pending appointments', example: 5 })
  pending: number;

  @ApiProperty({ description: 'Number of appointments today', example: 2 })
  today: number;

  @ApiProperty({
    description: 'Number of appointments this month',
    example: 15,
  })
  thisMonth: number;

  @ApiProperty({ description: 'Current rating', example: 4.5 })
  rating: number;
}
