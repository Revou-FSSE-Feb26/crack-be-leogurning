import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppointmentSessionType } from '@prisma/client';

@Injectable()
export class SessionTypesRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<AppointmentSessionType[]> {
    return this.prisma.appointmentSessionType.findMany({
      orderBy: [{ tier: 'asc' }, { name: 'asc' }],
    });
  }

  async findById(id: string): Promise<AppointmentSessionType | null> {
    return this.prisma.appointmentSessionType.findUnique({
      where: { id },
    });
  }

  async create(data: {
    name: string;
    durationMinutes: number;
    price: number;
    tier: number;
    isOnline: boolean;
    createdBy: string;
    updatedBy: string;
  }): Promise<AppointmentSessionType> {
    return this.prisma.appointmentSessionType.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      durationMinutes?: number;
      price?: number;
      tier?: number;
      isOnline?: boolean;
      updatedBy: string;
    },
  ): Promise<AppointmentSessionType> {
    return this.prisma.appointmentSessionType.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<AppointmentSessionType> {
    return this.prisma.appointmentSessionType.delete({
      where: { id },
    });
  }
}
