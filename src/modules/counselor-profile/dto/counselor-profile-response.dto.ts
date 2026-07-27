import { ApiProperty } from '@nestjs/swagger';

export class SessionTypeConfigDto {
  @ApiProperty({ description: 'Session type config ID', example: 'uuid-123' })
  id: string;

  @ApiProperty({
    description: 'Session type (ONLINE or OFFLINE)',
    example: 'ONLINE',
  })
  sessionType: string;

  @ApiProperty({
    description: 'Session type name',
    example: 'Individual Counseling',
  })
  name: string;

  @ApiProperty({ description: 'Price for the session', example: 150000 })
  price: number;

  @ApiProperty({ description: 'Duration in minutes', example: 60 })
  durationMinutes: number;

  @ApiProperty({
    description: 'Clinic address for offline sessions',
    example: null,
    nullable: true,
  })
  clinicAddress: string | null;
}

export class CounselorProfileResponseDto {
  @ApiProperty({ description: 'Counselor profile ID', example: 'uuid-123' })
  id: string;

  @ApiProperty({
    description: 'User ID linked to this counselor profile',
    example: 'uuid-456',
  })
  userId: string;

  @ApiProperty({ description: 'License number', example: 'PSY-2024-001' })
  licenseNumber: string;

  @ApiProperty({
    description: 'List of specializations',
    example: ['Anxiety', 'Depression'],
  })
  specializations: string[];

  @ApiProperty({
    description: 'Languages spoken',
    example: ['English', 'Indonesian'],
  })
  languages: string[];

  @ApiProperty({
    description: 'Whether the counselor is available',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'Availability slots',
    example: ['MON 09:00-17:00'],
  })
  availability: string[];

  @ApiProperty({ description: 'Average rating', example: 4.5 })
  rating: number;

  @ApiProperty({ description: 'Total number of reviews', example: 12 })
  reviewCount: number;

  @ApiProperty({
    description: 'Session type configurations',
    type: [SessionTypeConfigDto],
  })
  sessionTypeConfigs: SessionTypeConfigDto[];
}
