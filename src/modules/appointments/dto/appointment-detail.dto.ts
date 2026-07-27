import { ApiProperty } from '@nestjs/swagger';
import { AppointmentResponseDto } from './appointment-response.dto';

export class AppointmentDetailDto extends AppointmentResponseDto {
  @ApiProperty({
    description: 'Payment proof details',
    nullable: true,
    example: null,
  })
  paymentProof: {
    id: string;
    filename: string;
    status: string;
    submittedAt: string;
    rejectionReason: string | null;
  } | null;

  @ApiProperty({
    description: 'Review details',
    nullable: true,
    example: null,
  })
  review: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  } | null;
}
