import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionType } from '@prisma/client';

export interface FindAllCounselorsParams {
  page: number;
  limit: number;
  search?: string;
  specializationId?: string;
  sessionType?: SessionType;
  language?: string;
  minPrice?: number;
  maxPrice?: number;
}

@Injectable()
export class CounselorsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(params: FindAllCounselorsParams) {
    const {
      page,
      limit,
      search,
      specializationId,
      sessionType,
      language,
      minPrice,
      maxPrice,
    } = params;

    const skip = (page - 1) * limit;
    const where: any = {
      isAvailable: true,
    };

    if (search) {
      where.user = { fullName: { contains: search, mode: 'insensitive' } };
    }

    if (specializationId) {
      where.counselorSpecializations = {
        some: { specializationId },
      };
    }

    if (sessionType) {
      where.sessionTypeConfigs = {
        ...(where.sessionTypeConfigs || {}),
        some: {
          ...(where.sessionTypeConfigs?.some || {}),
          sessionType,
        },
      };
    }

    if (language) {
      where.languages = { has: language };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: any = {};
      if (minPrice !== undefined) priceFilter.gte = minPrice;
      if (maxPrice !== undefined) priceFilter.lte = maxPrice;

      where.sessionTypeConfigs = {
        some: {
          ...(where.sessionTypeConfigs?.some || {}),
          appointmentSessionType: { price: priceFilter },
        },
      };
    }

    const [counselors, total] = await Promise.all([
      this.prisma.counselorProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { fullName: true } },
          counselorSpecializations: {
            include: { specialization: true },
          },
          sessionTypeConfigs: {
            include: { appointmentSessionType: true },
          },
        },
        orderBy: { rating: 'desc' },
      }),
      this.prisma.counselorProfile.count({ where }),
    ]);

    return { counselors, total };
  }

  async findById(id: string) {
    return this.prisma.counselorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true } },
        counselorSpecializations: {
          include: { specialization: true },
        },
        sessionTypeConfigs: {
          include: { appointmentSessionType: true },
        },
        appointments: {
          where: {
            status: 'COMPLETED',
            review: { isNot: null },
          },
          include: {
            review: true,
            client: { select: { fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        counselorSchedules: true,
      },
    });
  }
}
