import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AppointmentStatus,
  SessionType,
  Role,
  Appointment,
} from '@prisma/client';

export interface FindAllAppointmentsParams {
  page: number;
  limit: number;
  status?: AppointmentStatus;
  sessionType?: SessionType;
  search?: string;
  userId?: string;
  userRole?: Role;
  counselorProfileId?: string;
}

@Injectable()
export class AppointmentsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(params: FindAllAppointmentsParams) {
    const {
      page,
      limit,
      status,
      sessionType,
      search,
      userId,
      userRole,
      counselorProfileId,
    } = params;

    const skip = (page - 1) * limit;
    const where: any = {};

    // Role-based ownership filtering
    if (userRole === Role.CLIENT) {
      where.clientId = userId;
    } else if (userRole === Role.COUNSELOR) {
      where.counselorId = counselorProfileId;
    }
    // ADMIN: no ownership filter

    // Optional filters
    if (status) {
      where.status = status;
    }

    if (sessionType) {
      where.sessionType = sessionType;
    }

    // Search on client name or counselor's user name
    if (search) {
      where.OR = [
        { client: { fullName: { contains: search, mode: 'insensitive' } } },
        {
          counselor: {
            user: { fullName: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: { select: { fullName: true } },
          counselor: { include: { user: { select: { fullName: true } } } },
          paymentProof: true,
          review: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { appointments, total };
  }

  async findById(id: string) {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: {
        client: { select: { fullName: true } },
        counselor: { include: { user: { select: { fullName: true } } } },
        paymentProof: true,
        review: true,
      },
    });
  }

  async create(data: {
    clientId: string;
    counselorId: string;
    sessionType: SessionType;
    date: Date;
    time: string;
    endTime: string;
    durationMinutes: number;
    rate: number;
    status: AppointmentStatus;
    notes?: string;
    referenceCode?: string;
    createdBy: string;
    updatedBy: string;
  }) {
    return this.prisma.appointment.create({
      data,
      include: {
        client: { select: { fullName: true } },
        counselor: { include: { user: { select: { fullName: true } } } },
        paymentProof: true,
        review: true,
      },
    });
  }

  async update(id: string, data: Partial<Appointment>) {
    return this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        client: { select: { fullName: true } },
        counselor: { include: { user: { select: { fullName: true } } } },
        paymentProof: true,
        review: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.appointment.delete({
      where: { id },
    });
  }
}
