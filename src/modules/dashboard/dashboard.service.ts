import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DashboardRepository } from './dashboard.repository';
import { ClientDashboardDto } from './dto/client-dashboard.dto';
import { CounselorDashboardDto } from './dto/counselor-dashboard.dto';
import { AdminDashboardDto } from './dto/admin-dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly prisma: PrismaService,
  ) {}

  async clientDashboard(userId: string): Promise<ClientDashboardDto> {
    const [upcomingCount, completedCount, nextSession] = await Promise.all([
      this.dashboardRepository.getClientUpcomingCount(userId),
      this.dashboardRepository.getClientCompletedCount(userId),
      this.dashboardRepository.getClientNextSession(userId),
    ]);

    return {
      upcomingCount,
      completedCount,
      nextSession: nextSession
        ? {
            id: nextSession.id,
            counselorName:
              nextSession.counselor?.user?.fullName ?? 'Unknown Counselor',
            date: nextSession.date.toISOString(),
            time: nextSession.time,
            sessionType: nextSession.sessionType,
          }
        : null,
    };
  }

  async counselorDashboard(userId: string): Promise<CounselorDashboardDto> {
    // Look up the user's counselorId
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { counselorId: true },
    });

    if (!user || !user.counselorId) {
      throw new NotFoundException('Counselor profile not found');
    }

    const counselorId = user.counselorId;

    const [pending, today, thisMonth, rating] = await Promise.all([
      this.dashboardRepository.getCounselorPendingCount(counselorId),
      this.dashboardRepository.getCounselorTodayCount(counselorId),
      this.dashboardRepository.getCounselorThisMonthCount(counselorId),
      this.dashboardRepository.getCounselorRating(counselorId),
    ]);

    return { pending, today, thisMonth, rating };
  }

  async adminDashboard(): Promise<AdminDashboardDto> {
    const [userStats, paymentStats, appointmentStats] = await Promise.all([
      this.dashboardRepository.getAdminUserStats(),
      this.dashboardRepository.getAdminPaymentStats(),
      this.dashboardRepository.getAdminAppointmentStats(),
    ]);

    return { userStats, paymentStats, appointmentStats };
  }
}
