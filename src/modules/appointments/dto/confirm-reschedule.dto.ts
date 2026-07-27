import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfirmRescheduleDto {
  @ApiPropertyOptional({
    description: 'Updated meeting link',
    example: 'https://meet.google.com/abc-def-ghi',
  })
  @IsOptional()
  @IsString()
  meetingLink?: string;
}
