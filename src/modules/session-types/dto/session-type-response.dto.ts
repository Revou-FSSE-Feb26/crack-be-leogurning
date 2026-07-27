import { ApiProperty } from '@nestjs/swagger';

export class SessionTypeResponseDto {
  @ApiProperty({
    description: 'Session type ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the session type',
    example: 'Basic Online Counseling',
  })
  name: string;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 60,
  })
  durationMinutes: number;

  @ApiProperty({
    description: 'Price in IDR',
    example: 150000,
  })
  price: number;

  @ApiProperty({
    description: 'Tier level',
    example: 1,
  })
  tier: number;

  @ApiProperty({
    description: 'Whether this is an online session type',
    example: true,
  })
  isOnline: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: string;
}
