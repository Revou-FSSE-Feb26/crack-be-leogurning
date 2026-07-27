import { ApiProperty } from '@nestjs/swagger';

export class PaymentProofResponseDto {
  @ApiProperty({ description: 'Payment proof ID' })
  id: string;

  @ApiProperty({ description: 'Associated appointment ID' })
  appointmentId: string;

  @ApiProperty({ description: 'Uploaded filename' })
  filename: string;

  @ApiProperty({ description: 'Submission timestamp' })
  submittedAt: Date;

  @ApiProperty({
    description: 'Proof status',
    enum: ['SUBMITTED', 'VERIFIED', 'REJECTED'],
  })
  status: string;

  @ApiProperty({ description: 'Reason for rejection', nullable: true })
  rejectionReason: string | null;

  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  updatedAt: Date;
}
