import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SpecializationResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the specialization',
    example: 'Cognitive Behavioral Therapy',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the specialization',
    example: 'A type of psychotherapy that helps patients manage problems.',
  })
  description: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: string;
}
