import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCounselorProfileDto {
  @ApiPropertyOptional({
    description: 'Languages spoken by the counselor',
    example: ['English', 'Indonesian'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Whether the counselor is currently available for bookings',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Availability slots for the counselor',
    example: ['MON 09:00-17:00', 'TUE 09:00-17:00'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availability?: string[];
}
