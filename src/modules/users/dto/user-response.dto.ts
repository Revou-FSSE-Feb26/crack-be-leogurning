import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @ApiProperty({
    description: 'Full name',
    example: 'John Doe',
    nullable: true,
  })
  fullName: string | null;

  @ApiProperty({
    description: 'Phone number',
    example: '+62 812 3456 789',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-15T00:00:00.000Z',
    nullable: true,
  })
  dateOfBirth: string | null;

  @ApiProperty({
    description: 'Emergency contact',
    example: '+62 812 9999 000',
    nullable: true,
  })
  emergencyContact: string | null;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({ description: 'User role', enum: Role, example: 'CLIENT' })
  role: Role;

  @ApiProperty({ description: 'Whether the user is active', example: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Linked counselor profile ID',
    example: 'uuid-string',
    nullable: true,
  })
  counselorId: string | null;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: string;
}
