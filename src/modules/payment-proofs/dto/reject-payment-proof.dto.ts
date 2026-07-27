import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RejectPaymentProofDto {
  @ApiProperty({
    description: 'Reason for rejecting the payment proof',
    example: 'Payment amount does not match the appointment rate',
  })
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}
