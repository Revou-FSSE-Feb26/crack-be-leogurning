import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentProofStatus } from '@prisma/client';

@Injectable()
export class PaymentProofsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.paymentProof.findUnique({
      where: { id },
      include: { appointment: true },
    });
  }

  async findByAppointmentId(appointmentId: string) {
    return this.prisma.paymentProof.findUnique({
      where: { appointmentId },
    });
  }

  async create(data: {
    appointmentId: string;
    filename: string;
    submittedAt: Date;
    createdBy: string;
    updatedBy: string;
  }) {
    return this.prisma.paymentProof.create({
      data,
      include: { appointment: true },
    });
  }

  async updateStatus(
    id: string,
    data: { status: PaymentProofStatus; rejectionReason?: string },
  ) {
    return this.prisma.paymentProof.update({
      where: { id },
      data,
      include: { appointment: true },
    });
  }
}
