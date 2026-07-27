import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CancelledBy } from '@prisma/client';

export class CancelAppointmentDto {
  @ApiProperty({
    description: 'Cancellation notes',
    example: 'Schedule conflict',
  })
  @IsString()
  @IsNotEmpty()
  cancellationNotes: string;

  @ApiProperty({
    description: 'Cancelled by',
    enum: CancelledBy,
    example: 'CLIENT',
  })
  @IsEnum(CancelledBy)
  cancelledBy: CancelledBy;
}
