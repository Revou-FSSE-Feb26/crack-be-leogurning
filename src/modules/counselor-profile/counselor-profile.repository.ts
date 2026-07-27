import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CounselorProfileRepository {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { counselorId: true },
    });

    if (!user?.counselorId) {
      return null;
    }

    return this.prisma.counselorProfile.findUnique({
      where: { id: user.counselorId },
      include: {
        counselorSpecializations: {
          include: { specialization: true },
        },
        sessionTypeConfigs: {
          include: { appointmentSessionType: true },
        },
      },
    });
  }

  async update(profileId: string, data: { languages?: string[]; isAvailable?: boolean; availability?: string[] }) {
    return this.prisma.counselorProfile.update({
      where: { id: profileId },
      data,
      include: {
        counselorSpecializations: {
          include: { specialization: true },
        },
        sessionTypeConfigs: {
          include: { appointmentSessionType: true },
        },
      },
    });
  }
}
