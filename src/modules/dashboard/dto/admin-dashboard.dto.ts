import { ApiProperty } from '@nestjs/swagger';

class UserStatsDto {
  @ApiProperty({ example: 150 })
  totalClients: number;

  @ApiProperty({ example: 20 })
  counselors: number;

  @ApiProperty({ example: 5 })
  today: number;

  @ApiProperty({ example: 30 })
  thisMonth: number;
}

class PaymentStatsDto {
  @ApiProperty({ example: 3 })
  pendingVerify: number;

  @ApiProperty({ example: 45 })
  verified: number;

  @ApiProperty({ example: 2 })
  rejected: number;

  @ApiProperty({ example: 15000000 })
  revenue: number;
}

class AppointmentStatsDto {
  @ApiProperty({ example: 10 })
  pending: number;

  @ApiProperty({ example: 25 })
  confirmed: number;

  @ApiProperty({ example: 100 })
  completed: number;

  @ApiProperty({ example: 8 })
  cancelled: number;
}

export class AdminDashboardDto {
  @ApiProperty({ description: 'User statistics', type: UserStatsDto })
  userStats: UserStatsDto;

  @ApiProperty({ description: 'Payment statistics', type: PaymentStatsDto })
  paymentStats: PaymentStatsDto;

  @ApiProperty({
    description: 'Appointment statistics',
    type: AppointmentStatsDto,
  })
  appointmentStats: AppointmentStatsDto;
}
