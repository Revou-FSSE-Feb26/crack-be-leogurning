import { ApiProperty } from '@nestjs/swagger';

export class AppointmentResponseDto {
  @ApiProperty({ description: 'Appointment ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Client user ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  clientId: string;

  @ApiProperty({ description: 'Counselor profile ID', example: '550e8400-e29b-41d4-a716-446655440002' })
  counselorId: string;

  @ApiProperty({ description: 'Session type', example: 'ONLINE' })
  sessionType: string;

  @ApiProperty({ description: 'Appointment date', example: '2024-03-15' })
  date: string;

  @ApiProperty({ description: 'Start time', example: '09:00' })
  time: string;

  @ApiProperty({ description: 'End time', example: '10:00' })
  endTime: string;

  @ApiProperty({ description: 'Duration in minutes', example: 60 })
  durationMinutes: number;

  @ApiProperty({ description: 'Rate/price', example: 150000 })
  rate: number;

  @ApiProperty({ description: 'Appointment status', example: 'PENDING' })
  status: string;

  @ApiProperty({ description: 'Meeting link', nullable: true, example: null })
  meetingLink: string | null;

  @ApiProperty({ description: 'Notes', nullable: true, example: null })
  notes: string | null;

  @ApiProperty({ description: 'Reference code', nullable: true, example: null })
  referenceCode: string | null;

  @ApiProperty({ description: 'Cancellation notes', nullable: true, example: null })
  cancellationNotes: string | null;

  @ApiProperty({ description: 'Cancelled at timestamp', nullable: true, example: null })
  cancelledAt: string | null;

  @ApiProperty({ description: 'Cancelled by', nullable: true, example: null })
  cancelledBy: string | null;

  @ApiProperty({ description: 'Client name', nullable: true, example: 'John Doe' })
  clientName: string | null;

  @ApiProperty({ description: 'Counselor name', nullable: true, example: 'Dr. Smith' })
  counselorName: string | null;

  @ApiProperty({ description: 'Created at timestamp', example: '2024-03-15T09:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Updated at timestamp', example: '2024-03-15T09:00:00.000Z' })
  updatedAt: string;
}
