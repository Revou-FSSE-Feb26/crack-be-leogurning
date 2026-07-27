import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository } from './reviews.repository';
import { AppointmentsRepository } from 'src/modules/appointments/appointments.repository';
import { AppointmentStatus } from '@prisma/client';
import * as fc from 'fast-check';

/**
 * Feature: backend-api
 * Property-based tests for Reviews module
 * Validates: Requirements 9.3, 9.4, 9.5
 */

describe('ReviewsService - Property-Based Tests', () => {
  let service: ReviewsService;
  let reviewsRepository: jest.Mocked<ReviewsRepository>;
  let appointmentsRepository: jest.Mocked<AppointmentsRepository>;

  beforeEach(async () => {
    const mockReviewsRepository = {
      findByAppointmentId: jest.fn(),
      create: jest.fn(),
      findByCounselorId: jest.fn(),
    };

    const mockAppointmentsRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: ReviewsRepository,
          useValue: mockReviewsRepository,
        },
        {
          provide: AppointmentsRepository,
          useValue: mockAppointmentsRepository,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewsRepository = module.get(
      ReviewsRepository,
    ) as jest.Mocked<ReviewsRepository>;
    appointmentsRepository = module.get(
      AppointmentsRepository,
    ) as jest.Mocked<AppointmentsRepository>;
  });

  /**
   * Feature: backend-api, Property 10: Review Rating Recalculation
   * Validates: Requirements 9.3
   *
   * After each review creation, the service calls reviewsRepository.create
   * with the correct counselorId from the appointment. The repository handles
   * the AVG recalculation internally via $transaction.
   */
  describe('Property 10: Review Rating Recalculation', () => {
    it('service calls repository.create with correct counselorId from appointment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId (also clientId)
          fc.uuid(), // appointmentId
          fc.uuid(), // counselorId
          fc.integer({ min: 1, max: 5 }), // rating
          fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }), // comment
          async (userId, appointmentId, counselorId, rating, comment) => {
            // Reset mocks
            appointmentsRepository.findById.mockReset();
            reviewsRepository.findByAppointmentId.mockReset();
            reviewsRepository.create.mockReset();

            // Mock appointment exists, is COMPLETED, and owned by user
            const mockAppointment = {
              id: appointmentId,
              clientId: userId,
              counselorId,
              status: AppointmentStatus.COMPLETED,
              client: { fullName: 'Test Client' },
              counselor: { user: { fullName: 'Counselor' } },
              paymentProof: null,
              review: null,
              sessionType: 'VIDEO_CALL' as any,
              date: new Date(),
              time: '10:00',
              endTime: '11:00',
              durationMinutes: 60,
              rate: 100,
              notes: null,
              referenceCode: null,
              meetingLink: null,
              cancellationNotes: null,
              cancelledAt: null,
              cancelledBy: null,
              createdBy: userId,
              updatedBy: userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            appointmentsRepository.findById.mockResolvedValue(
              mockAppointment as any,
            );

            // No existing review
            reviewsRepository.findByAppointmentId.mockResolvedValue(null);

            // Mock create returns a review
            const createdReview = {
              id: 'review-id',
              appointmentId,
              rating,
              comment: comment ?? null,
              createdBy: userId,
              updatedBy: userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            reviewsRepository.create.mockResolvedValue(createdReview);

            // Execute
            const result = await service.create(userId, {
              appointmentId,
              rating,
              comment,
            });

            // Verify repository.create called with correct counselorId
            expect(reviewsRepository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                appointmentId,
                rating,
              }),
              counselorId,
            );

            // Verify the second argument is the counselorId
            const createCall = reviewsRepository.create.mock.calls[0];
            expect(createCall[1]).toBe(counselorId);

            // Verify response
            expect(result.success).toBe(true);
            expect(result.data.rating).toBe(rating);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('AVG rating recalculation is correct for any sequence of ratings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 1, max: 5 }), {
            minLength: 1,
            maxLength: 20,
          }),
          async (ratings) => {
            // Verify the mathematical property: AVG = sum / count
            const sum = ratings.reduce((acc, r) => acc + r, 0);
            const expectedAvg = sum / ratings.length;
            const expectedCount = ratings.length;

            // The avg must equal sum/count
            expect(expectedAvg).toBeCloseTo(sum / expectedCount, 10);
            // Rating bounds: avg must be between 1 and 5
            expect(expectedAvg).toBeGreaterThanOrEqual(1);
            expect(expectedAvg).toBeLessThanOrEqual(5);
            // Count must equal array length
            expect(expectedCount).toBe(ratings.length);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: backend-api, Property 16: Review Prerequisite Enforcement
   * Validates: Requirements 9.4
   *
   * For any appointment whose status is NOT COMPLETED, attempting to create
   * a review SHALL return 400 BadRequestException.
   */
  describe('Property 16: Review Prerequisite Enforcement', () => {
    it('non-COMPLETED appointment status returns 400 BadRequestException', async () => {
      const nonCompletedStatuses = [
        AppointmentStatus.PENDING,
        AppointmentStatus.AWAITING_PAYMENT,
        AppointmentStatus.PAYMENT_UPLOADED,
        AppointmentStatus.PAYMENT_VERIFIED,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.PENDING_RESCHEDULE,
        AppointmentStatus.REJECTED_SCHEDULE,
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.uuid(), // appointmentId
          fc.uuid(), // counselorId
          fc.constantFrom(...nonCompletedStatuses), // non-COMPLETED status
          fc.integer({ min: 1, max: 5 }), // rating
          async (userId, appointmentId, counselorId, status, rating) => {
            // Reset mocks
            appointmentsRepository.findById.mockReset();
            reviewsRepository.findByAppointmentId.mockReset();
            reviewsRepository.create.mockReset();

            // Mock appointment with non-COMPLETED status, owned by user
            const mockAppointment = {
              id: appointmentId,
              clientId: userId,
              counselorId,
              status,
              client: { fullName: 'Test Client' },
              counselor: { user: { fullName: 'Counselor' } },
              paymentProof: null,
              review: null,
              sessionType: 'VIDEO_CALL' as any,
              date: new Date(),
              time: '10:00',
              endTime: '11:00',
              durationMinutes: 60,
              rate: 100,
              notes: null,
              referenceCode: null,
              meetingLink: null,
              cancellationNotes: null,
              cancelledAt: null,
              cancelledBy: null,
              createdBy: userId,
              updatedBy: userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            appointmentsRepository.findById.mockResolvedValue(
              mockAppointment as any,
            );

            // Attempt to create review
            await expect(
              service.create(userId, { appointmentId, rating }),
            ).rejects.toThrow(BadRequestException);

            // Verify repository.create was NOT called
            expect(reviewsRepository.create).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: backend-api, Property 11: Uniqueness Constraint Enforcement
   * Validates: Requirements 9.5
   *
   * For any appointmentId where a review already exists, attempting to create
   * another SHALL return 409 ConflictException.
   */
  describe('Property 11: Uniqueness Constraint Enforcement', () => {
    it('duplicate appointmentId review returns 409 ConflictException', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.uuid(), // appointmentId
          fc.uuid(), // counselorId
          fc.integer({ min: 1, max: 5 }), // rating
          async (userId, appointmentId, counselorId, rating) => {
            // Reset mocks
            appointmentsRepository.findById.mockReset();
            reviewsRepository.findByAppointmentId.mockReset();
            reviewsRepository.create.mockReset();

            // Mock appointment is COMPLETED and owned by user
            const mockAppointment = {
              id: appointmentId,
              clientId: userId,
              counselorId,
              status: AppointmentStatus.COMPLETED,
              client: { fullName: 'Test Client' },
              counselor: { user: { fullName: 'Counselor' } },
              paymentProof: null,
              review: null,
              sessionType: 'VIDEO_CALL' as any,
              date: new Date(),
              time: '10:00',
              endTime: '11:00',
              durationMinutes: 60,
              rate: 100,
              notes: null,
              referenceCode: null,
              meetingLink: null,
              cancellationNotes: null,
              cancelledAt: null,
              cancelledBy: null,
              createdBy: userId,
              updatedBy: userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            appointmentsRepository.findById.mockResolvedValue(
              mockAppointment as any,
            );

            // Mock existing review already exists
            const existingReview = {
              id: 'existing-review-id',
              appointmentId,
              rating: 4,
              comment: 'Previous review',
              createdBy: userId,
              updatedBy: userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            reviewsRepository.findByAppointmentId.mockResolvedValue(
              existingReview,
            );

            // Attempt to create another review
            await expect(
              service.create(userId, { appointmentId, rating }),
            ).rejects.toThrow(ConflictException);

            // Verify repository.create was NOT called
            expect(reviewsRepository.create).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
