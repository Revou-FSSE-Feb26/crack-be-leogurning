import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardRepository {
  constructor(private prisma: PrismaService) {}

  // Client stats
  async getClientUpcomingCount(clientId: string): Promise<number> {
    return this.prisma.appointment.count({
      where: {
        clientId,
        status: { in: ['CONFIRMED', 'PENDING', 'PAYMENT_VERIFIED'] },
      },
    });
  }

  async getClientCompletedCount(clientId: string): Promise<number> {
    return this.prisma.appointment.count({
      where: { clientId, status: 'COMPLETED' },
    });
  }

  async getClientNextSession(clientId: string) {
    return this.prisma.appointment.findFirst({
      where: {
        clientId,
        status: 'CONFIRMED',
        date: { gte: new Date() },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      include: {
        counselor: { include: { user: { select: { fullName: true } } } },
      },
    });
  }

  // Counselor stats
  async getCounselorPendingCount(counselorId: string): Promise<number> {
    return this.prisma.appointment.count({
      where: { counselorId, status: 'PENDING' },
    });
  }

  async getCounselorTodayCount(counselorId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.prisma.appointment.count({
      where: { counselorId, date: { gte: today, lt: tomorrow } },
    });
  }

  async getCounselorThisMonthCount(counselorId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    );
    return this.prisma.appointment.count({
      where: { counselorId, date: { gte: startOfMonth, lt: startOfNextMonth } },
    });
  }

  async getCounselorRating(counselorId: string): Promise<number> {
    const profile = await this.prisma.counselorProfile.findUnique({
      where: { id: counselorId },
      select: { rating: true },
    });
    return profile ? Number(profile.rating) : 0;
  }

  // Admin stats
  async getAdminUserStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalClients, counselors, todayUsers, thisMonthUsers] =
      await Promise.all([
        this.prisma.user.count({ where: { role: 'CLIENT' } }),
        this.prisma.user.count({ where: { role: 'COUNSELOR' } }),
        this.prisma.user.count({ where: { createdAt: { gte: today } } }),
        this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      ]);

    return {
      totalClients,
      counselors,
      today: todayUsers,
      thisMonth: thisMonthUsers,
    };
  }

  async getAdminPaymentStats() {
    const [pendingVerify, verified, rejected] = await Promise.all([
      this.prisma.paymentProof.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.paymentProof.count({ where: { status: 'VERIFIED' } }),
      this.prisma.paymentProof.count({ where: { status: 'REJECTED' } }),
    ]);

    // Revenue from verified payment proofs (sum of appointment rates)
    const revenueResult = await this.prisma.appointment.aggregate({
      where: { paymentProof: { status: 'VERIFIED' } },
      _sum: { rate: true },
    });

    return {
      pendingVerify,
      verified,
      rejected,
      revenue: Number(revenueResult._sum.rate ?? 0),
    };
  }

  async getAdminAppointmentStats() {
    const [pending, confirmed, completed, cancelled] = await Promise.all([
      this.prisma.appointment.count({ where: { status: 'PENDING' } }),
      this.prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.appointment.count({ where: { status: 'CANCELLED' } }),
    ]);

    return { pending, confirmed, completed, cancelled };
  }
}
