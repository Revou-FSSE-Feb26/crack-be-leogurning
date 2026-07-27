import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SessionType } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'Counselor profile ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  counselorId: string;

  @ApiProperty({
    description: 'Session type',
    enum: SessionType,
    example: 'ONLINE',
  })
  @IsEnum(SessionType)
  sessionType: SessionType;

  @ApiProperty({
    description: 'Appointment date (ISO)',
    example: '2024-03-15',
  })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Start time (HH:MM)', example: '09:00' })
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty({ description: 'End time (HH:MM)', example: '10:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ description: 'Duration in minutes', example: 60, minimum: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  durationMinutes: number;

  @ApiProperty({ description: 'Rate/price', example: 150000, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  rate: number;

  @ApiPropertyOptional({
    description: 'Notes',
    example: 'First session',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Reference code',
    example: 'REF-001',
  })
  @IsOptional()
  @IsString()
  referenceCode?: string;
}
