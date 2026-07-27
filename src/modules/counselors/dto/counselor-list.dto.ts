import { ApiProperty } from '@nestjs/swagger';

class SessionTypePrice {
  @ApiProperty({
    description: 'Session type name',
    example: 'Basic Counseling',
  })
  name: string;

  @ApiProperty({ description: 'Price', example: 150000 })
  price: number;

  @ApiProperty({ description: 'Duration in minutes', example: 60 })
  durationMinutes: number;
}

export class CounselorListDto {
  @ApiProperty({
    description: 'Counselor profile ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({ description: 'User ID', example: 'uuid-string' })
  userId: string;

  @ApiProperty({ description: 'Full name', example: 'Dr. Sarah Johnson' })
  fullName: string;

  @ApiProperty({ description: 'License number', example: 'PSY-2024-001' })
  licenseNumber: string;

  @ApiProperty({
    description: 'Specialization names',
    type: [String],
    example: ['Anxiety', 'Depression'],
  })
  specializations: string[];

  @ApiProperty({
    description: 'Session type pricing',
    example: {
      online: { name: 'Online Session', price: 150000, durationMinutes: 60 },
      offline: { name: 'Offline Session', price: 200000, durationMinutes: 60 },
    },
  })
  sessionTypes: { online?: SessionTypePrice; offline?: SessionTypePrice };

  @ApiProperty({
    description: 'Availability days',
    type: [String],
    example: ['MON', 'WED', 'FRI'],
  })
  availability: string[];

  @ApiProperty({ description: 'Average rating', example: 4.5 })
  rating: number;

  @ApiProperty({ description: 'Total review count', example: 12 })
  reviewCount: number;

  @ApiProperty({
    description: 'Languages spoken',
    type: [String],
    example: ['English', 'Indonesian'],
  })
  languages: string[];

  @ApiProperty({ description: 'Is currently available', example: true })
  isAvailable: boolean;
}
