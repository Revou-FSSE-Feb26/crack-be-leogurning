import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReviewsRepository {
  constructor(private prisma: PrismaService) {}

  async findByAppointmentId(appointmentId: string) {
    return this.prisma.review.findUnique({
      where: { appointmentId },
    });
  }

  async create(
    data: {
      appointmentId: string;
      rating: number;
      comment?: string;
      createdBy: string;
      updatedBy: string;
    },
    counselorId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          appointmentId: data.appointmentId,
          rating: data.rating,
          comment: data.comment,
          createdBy: data.createdBy,
          updatedBy: data.updatedBy,
        },
      });

      const reviews = await tx.review.findMany({
        where: { appointment: { counselorId } },
        select: { rating: true },
      });

      const avg =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await tx.counselorProfile.update({
        where: { id: counselorId },
        data: { rating: avg, reviewCount: reviews.length },
      });

      return review;
    });
  }

  async findByCounselorId(counselorId: string) {
    return this.prisma.review.findMany({
      where: { appointment: { counselorId } },
      include: {
        appointment: {
          include: { client: { select: { fullName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
