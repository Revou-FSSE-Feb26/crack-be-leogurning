import { ApiProperty } from '@nestjs/swagger';
import { CounselorListDto } from './counselor-list.dto';

class ReviewSummaryDto {
  @ApiProperty({ description: 'Review ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'Rating score', example: 5 })
  rating: number;

  @ApiProperty({
    description: 'Review comment',
    nullable: true,
    example: 'Very helpful session',
  })
  comment: string | null;

  @ApiProperty({ description: 'Review author name', example: 'John Doe' })
  authorName: string;

  @ApiProperty({
    description: 'Review creation date',
    example: '2024-01-15T10:00:00.000Z',
  })
  createdAt: string;
}

class ScheduleSlotDto {
  @ApiProperty({ description: 'Schedule slot ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'Day of week', example: 'MON' })
  dayOfWeek: string;

  @ApiProperty({ description: 'Start time', example: '09:00' })
  startTime: string;

  @ApiProperty({ description: 'End time', example: '10:00' })
  endTime: string;
}

export class CounselorDetailDto extends CounselorListDto {
  @ApiProperty({
    description: 'Counselor reviews',
    type: [ReviewSummaryDto],
  })
  reviews: ReviewSummaryDto[];

  @ApiProperty({
    description: 'Counselor schedule slots',
    type: [ScheduleSlotDto],
  })
  schedules: ScheduleSlotDto[];
}
