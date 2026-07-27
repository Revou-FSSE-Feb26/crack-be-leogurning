import { ApiProperty } from '@nestjs/swagger';

export class ReviewResponseDto {
  @ApiProperty({ description: 'Review ID' })
  id: string;

  @ApiProperty({ description: 'Associated appointment ID' })
  appointmentId: string;

  @ApiProperty({ description: 'Rating from 1 to 5', example: 5 })
  rating: number;

  @ApiProperty({ description: 'Review comment', nullable: true })
  comment: string | null;

  @ApiProperty({ description: 'Name of the review author' })
  authorName: string;

  @ApiProperty({ description: 'Review creation timestamp' })
  createdAt: string;
}
