import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID', example: 'uuid-here' })
  id: string;

  @ApiProperty({ description: 'User ID', example: 'uuid-here' })
  userId: string;

  @ApiProperty({
    description: 'Notification type',
    example: 'APPOINTMENT_REMINDER',
  })
  type: string;

  @ApiProperty({ description: 'Title', example: 'Session Reminder' })
  title: string;

  @ApiProperty({
    description: 'Message body',
    example: 'Your session starts in 30 minutes',
  })
  message: string;

  @ApiProperty({
    description: 'Whether the notification has been read',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;
}
