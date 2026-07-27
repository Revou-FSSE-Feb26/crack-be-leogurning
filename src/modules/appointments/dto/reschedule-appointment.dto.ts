import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiProperty({ description: 'New date', example: '2024-03-20' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'New start time', example: '10:00' })
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty({ description: 'New end time', example: '11:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;
}
