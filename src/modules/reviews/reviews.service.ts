import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentsRepository } from 'src/modules/appointments/appointments.repository';
import { ReviewsRepository } from './reviews.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly appointmentsRepository: AppointmentsRepository,
  ) {}

  async create(
    userId: string,
    dto: CreateReviewDto,
  ): Promise<{ success: boolean; message: string; data: ReviewResponseDto }> {
    // 1. Verify appointment exists
    const appointment = await this.appointmentsRepository.findById(
      dto.appointmentId,
    );
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // 2. Verify CLIENT owns the appointment
    if (appointment.clientId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // 3. Verify appointment is COMPLETED
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Can only review completed appointments',
      );
    }

    // 4. Verify no existing review
    const existingReview = await this.reviewsRepository.findByAppointmentId(
      dto.appointmentId,
    );
    if (existingReview) {
      throw new ConflictException(
        'Review already exists for this appointment',
      );
    }

    // 5. Create review + recalculate rating
    const review = await this.reviewsRepository.create(
      {
        appointmentId: dto.appointmentId,
        rating: dto.rating,
        comment: dto.comment,
        createdBy: userId,
        updatedBy: userId,
      },
      appointment.counselorId,
    );

    return {
      success: true,
      message: 'Review created successfully',
      data: this.formatReview(review, appointment),
    };
  }

  async findByCounselor(
    counselorId: string,
  ): Promise<{ data: ReviewResponseDto[] }> {
    const reviews =
      await this.reviewsRepository.findByCounselorId(counselorId);
    return {
      data: reviews.map((r) => this.formatReview(r, r.appointment)),
    };
  }

  private formatReview(review: any, appointment?: any): ReviewResponseDto {
    return {
      id: review.id,
      appointmentId: review.appointmentId,
      rating: review.rating,
      comment: review.comment ?? null,
      authorName: appointment?.client?.fullName ?? 'Anonymous',
      createdAt: review.createdAt.toISOString(),
    };
  }
}
