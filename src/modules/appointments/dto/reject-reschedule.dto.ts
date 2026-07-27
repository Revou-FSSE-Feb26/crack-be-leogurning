import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectRescheduleDto {
  @ApiProperty({
    description: 'Rejection reason',
    example: 'Not available at that time',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
