import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  Matches,
  ValidateNested,
} from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class ScheduleSlotInput {
  @ApiProperty({
    description: 'Day of the week',
    enum: DayOfWeek,
    example: 'MON',
  })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ description: 'Start time in HH:MM format', example: '09:00' })
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format' })
  startTime: string;

  @ApiProperty({ description: 'End time in HH:MM format', example: '10:00' })
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:MM format' })
  endTime: string;
}

export class BulkReplaceScheduleDto {
  @ApiProperty({
    description: 'Array of schedule slots to replace existing schedule',
    type: [ScheduleSlotInput],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotInput)
  slots: ScheduleSlotInput[];
}
