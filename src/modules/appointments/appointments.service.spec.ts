import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService, JwtPayload } from './appointments.service';
import { AppointmentsRepository } from './appointments.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fc from 'fast-check';
import { AppointmentStatus, SessionType, Role } from '@prisma/client';

/**
 * Feature: backend-api
 * Property-based tests for Appointments module
 * Validates: Requirements 5.3, 5.4, 5.5, 5.1, 5.10, 5.11, 5.12, 5.17, 5.18, 5.19, 5.20
 */

// Helper to create a mock appointment entity
function createMockAppointment(overrides: Partial<any> = {}): any {
  return {
    id: overrides.id ?? 'appointment-id-1',
    clientId: overrides.clientId ?? 'client-id-1',
    counselorId: overrides.counselorId ?? 'counselor-id-1',
    sessionType: overrides.sessionType ?? SessionType.ONLINE,
    date: overrides.date ?? new Date('2024-03-15'),
    time: overrides.time ?? '09:00',
    endTime: overrides.endTime ?? '10:00',
    durationMinutes: overrides.durationMinutes ?? 60,
    rate: overrides.rate ?? 150000,
    status: overrides.status ?? AppointmentStatus.PENDING,
    meetingLink: overrides.meetingLink ?? null,
    notes: overrides.notes ?? null,
    referenceCode: overrides.referenceCode ?? null,
    cancellationNotes: overrides.cancellationNotes ?? null,
    cancelledAt: overrides.cancelledAt ?? null,
    cancelledBy: overrides.cancelledBy ?? null,
    client: overrides.client ?? { fullName: 'Test Client' },
    counselor: overrides.counselor ?? { user: { fullName: 'Test Counselor' } },
    paymentProof: overrides.paymentProof ?? null,
    review: overrides.review ?? null,
    createdAt: overrides.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
    createdBy: overrides.createdBy ?? 'user-id-1',
    updatedBy: overrides.updatedBy ?? 'user-id-1',
  };
}

describe('AppointmentsService - Property-Based Tests', () => {
  let service: AppointmentsService;
  let repository: jest.Mocked<AppointmentsRepository>;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: AppointmentsRepository, useValue: mockRepository },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    repository = module.get(
      AppointmentsRepository,
    ) as jest.Mocked<AppointmentsRepository>;
    prisma = module.get(PrismaService) as any;
  });

  /**
   * Feature: backend-api, Property 3: Role-Based Ownership Filtering
   * Validates: Requirements 5.3, 5.4, 5.5
   *
   * - For any Client user, the appointments list SHALL return only appointments
   *   where clientId matches the user's ID (repository called with userId = user.id, userRole = CLIENT)
   * - For any Counselor user, it SHALL return only appointments where counselorId
   *   matches their counselorProfileId (repository called with counselorProfileId)
   * - For any Admin user, no ownership filter is applied (repository called with userRole = ADMIN)
   */
  describe('Property 3: Role-Based Ownership Filtering', () => {
    it('CLIENT: repository is called with userId = user.id and userRole = CLIENT', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.integer({ min: 1, max: 20 }), // page
          fc.integer({ min: 1, max: 50 }), // limit
          async (userId, page, limit) => {
            const user: JwtPayload = {
              id: userId,
              email: 'client@test.com',
              role: Role.CLIENT,
            };

            const query = { page, limit };

            repository.findAll.mockResolvedValue({
              appointments: [],
              total: 0,
            });

            await service.findAll(user, query as any);

            // Verify repository was called with correct ownership filters
            expect(repository.findAll).toHaveBeenCalledWith(
              expect.objectContaining({
                userId: userId,
                userRole: Role.CLIENT,
                page,
                limit,
              }),
            );

            // Verify counselorProfileId is NOT set for CLIENT
            const callArgs = repository.findAll.mock.calls[0][0];
            expect(callArgs.counselorProfileId).toBeUndefined();

            repository.findAll.mockClear();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('COUNSELOR: repository is called with counselorProfileId matching the user counselorId', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.uuid(), // counselorProfileId
          fc.integer({ min: 1, max: 20 }), // page
          fc.integer({ min: 1, max: 50 }), // limit
          async (userId, counselorProfileId, page, limit) => {
            const user: JwtPayload = {
              id: userId,
              email: 'counselor@test.com',
              role: Role.COUNSELOR,
            };

            const query = { page, limit };

            // Mock prisma to return counselorId for this user
            prisma.user.findUnique.mockResolvedValue({
              counselorId: counselorProfileId,
            });

            repository.findAll.mockResolvedValue({
              appointments: [],
              total: 0,
            });

            await service.findAll(user, query as any);

            // Verify repository was called with counselorProfileId
            expect(repository.findAll).toHaveBeenCalledWith(
              expect.objectContaining({
                userId: userId,
                userRole: Role.COUNSELOR,
                counselorProfileId: counselorProfileId,
                page,
                limit,
              }),
            );

            repository.findAll.mockClear();
            prisma.user.findUnique.mockClear();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('ADMIN: repository is called with userRole = ADMIN and no userId ownership filter restriction', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.integer({ min: 1, max: 20 }), // page
          fc.integer({ min: 1, max: 50 }), // limit
          async (userId, page, limit) => {
            const user: JwtPayload = {
              id: userId,
              email: 'admin@test.com',
              role: Role.ADMIN,
            };

            const query = { page, limit };

            repository.findAll.mockResolvedValue({
              appointments: [],
              total: 0,
            });

            await service.findAll(user, query as any);

            // Verify repository was called with ADMIN role
            expect(repository.findAll).toHaveBeenCalledWith(
              expect.objectContaining({
                userId: userId,
                userRole: Role.ADMIN,
                page,
                limit,
              }),
            );

            // Verify counselorProfileId is NOT set for ADMIN
            const callArgs = repository.findAll.mock.calls[0][0];
            expect(callArgs.counselorProfileId).toBeUndefined();

            repository.findAll.mockClear();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: backend-api, Property 7: Appointment Status State Machine
   * Validates: Requirements 5.1, 5.10, 5.11, 5.12, 5.17, 5.18, 5.19, 5.20
   *
   * For any valid status transition action, the resulting appointment status
   * SHALL be exactly the defined target:
   * - create with ONLINE → AWAITING_PAYMENT
   * - create with OFFLINE → PENDING
   * - confirm → CONFIRMED
   * - cancel → CANCELLED (with cancelledAt set)
   * - reschedule → PENDING_RESCHEDULE
   * - start → IN_PROGRESS
   * - complete → COMPLETED
   * - confirmReschedule → CONFIRMED
   * - rejectReschedule → REJECTED_SCHEDULE
   */
  describe('Property 7: Appointment Status State Machine', () => {
    it('create with ONLINE → AWAITING_PAYMENT', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.uuid(), // counselorId
          fc.integer({ min: 1, max: 120 }), // durationMinutes
          fc.integer({ min: 10000, max: 500000 }), // rate
          async (userId, counselorId, durationMinutes, rate) => {
            const dto = {
              counselorId,
              sessionType: SessionType.ONLINE,
              date: '2024-03-15',
              time: '09:00',
              endTime: '10:00',
              durationMinutes,
              rate,
            };

            const createdEntity = createMockAppointment({
              clientId: userId,
              counselorId,
              sessionType: SessionType.ONLINE,
              status: AppointmentStatus.AWAITING_PAYMENT,
            });

            repository.create.mockResolvedValue(createdEntity);

            const result = await service.create(userId, dto as any);

            // Verify repository.create was called with AWAITING_PAYMENT status
            expect(repository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                status: AppointmentStatus.AWAITING_PAYMENT,
                sessionType: SessionType.ONLINE,
                clientId: userId,
              }),
            );

            expect(result.data.status).toBe(AppointmentStatus.AWAITING_PAYMENT);

            repository.create.mockClear();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('create with OFFLINE → PENDING', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.uuid(), // counselorId
          fc.integer({ min: 1, max: 120 }), // durationMinutes
          fc.integer({ min: 10000, max: 500000 }), // rate
          async (userId, counselorId, durationMinutes, rate) => {
            const dto = {
              counselorId,
              sessionType: SessionType.OFFLINE,
              date: '2024-03-15',
              time: '09:00',
              endTime: '10:00',
              durationMinutes,
              rate,
            };

            const createdEntity = createMockAppointment({
              clientId: userId,
              counselorId,
              sessionType: SessionType.OFFLINE,
              status: AppointmentStatus.PENDING,
            });

            repository.create.mockResolvedValue(createdEntity);

            const result = await service.create(userId, dto as any);

            // Verify repository.create was called with PENDING status
            expect(repository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                status: AppointmentStatus.PENDING,
                sessionType: SessionType.OFFLINE,
                clientId: userId,
              }),
            );

            expect(result.data.status).toBe(AppointmentStatus.PENDING);

            repository.create.mockClear();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('confirm → CONFIRMED', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId (counselor's user id)
          fc.uuid(), // appointmentId
          fc.uuid(), // counselorProfileId
          async (userId, appointmentId, counselorProfileId) => {
            const existingAppointment = createMockAppointment({
              id: appointmentId,
              counselorId: counselorProfileId,
              status: AppointmentStatus.PENDING,
            });

            repository.findById.mockResolvedValue(existingAppointment);
            prisma.user.findUnique.mockResolvedValue({
              counselorId: counselorProfileId,
            });

            const updatedAppointment = createMockAppointment({
              ...existingAppointment,
              status: AppointmentStatus.CONFIRMED,
            });
            repository.update.mockResolvedValue(updatedAppointment);

            const result = await service.confirm(userId, appointmentId, {});

            // Verify update was called with CONFIRMED status
            expect(repository.update).toHaveBeenCalledWith(
              appointmentId,
              expect.objectContaining({
                status: AppointmentStatus.CONFIRMED,
              }),
            );

            expect(result.data.status).toBe(AppointmentStatus.CONFIRMED);

            repository.findById.mockClear();
            repository.update.mockClear();
            prisma.user.findUnique.mockClear();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('cancel → CANCELLED with cancelledAt set', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // appointmentId
          fc.string({ minLength: 3, maxLength: 50 }), // cancellationNotes
          async (appointmentId, cancellationNotes) => {
            const existingAppointment = createMockAppointment({
              id: appointmentId,
              status: AppointmentStatus.CONFIRMED,
            });

            repository.findById.mockResolvedValue(existingAppointment);

            const updatedAppointment = createMockAppointment({
              ...existingAppointment,
              status: AppointmentStatus.CANCELLED,
              cancelledAt: new Date(),
              cancellationNotes,
            });
            repository.update.mockResolvedValue(updatedAppointment);

            const result = await service.cancel(appointmentId, {
              cancellationNotes,
              cancelledBy: 'CLIENT' as any,
            });

            // Verify update was called with CANCELLED status and cancelledAt
            expect(repository.update).toHaveBeenCalledWith(
              appointmentId,
              expect.objectContaining({
                status: AppointmentStatus.CANCELLED,
                cancelledAt: expect.any(Date),
                cancellationNotes,
              }),
            );

            expect(result.data.status).toBe(AppointmentStatus.CANCELLED);

            repository.findById.mockClear();
            repository.update.mockClear();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('reschedule → PENDING_RESCHEDULE', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId (client)
          fc.uuid(), // appointmentId
          async (userId, appointmentId) => {
            const existingAppointment = createMockAppointment({
              id: appointmentId,
              clientId: userId, // Client owns the appointment
              status: AppointmentStatus.CONFIRMED,
            });

            repository.findById.mockResolvedValue(existingAppointment);

            const updatedAppointment = createMockAppointment({
              ...existingAppointment,
              status: AppointmentStatus.PENDING_RESCHEDULE,
            });
            repository.update.mockResolvedValue(updatedAppointment);

            const result = await service.reschedule(userId, appointmentId, {
              date: '2024-04-01',
              time: '14:00',
              endTime: '15:00',
            });

            // Verify update was called with PENDING_RESCHEDULE status
            expect(repository.update).toHaveBeenCalledWith(
              appointmentId,
              expect.objectContaining({
                status: AppointmentStatus.PENDING_RESCHEDULE,
              }),
            );

            expect(result.data.status).toBe(
              AppointmentStatus.PENDING_RESCHEDULE,
            );

            repository.findById.mockClear();
            repository.update.mockClear();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('start → IN_PROGRESS', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId (counselor's user id)
          fc.uuid(), // appointmentId
          fc.uuid(), // counselorProfileId
          async (userId, appointmentId, counselorProfileId) => {
            const existingAppointment = createMockAppointment({
              id: appointmentId,
              counselorId: counselorProfileId,
              status: AppointmentStatus.CONFIRMED,
            });

            repository.findById.mockResolvedValue(existingAppointment);
            prisma.user.findUnique.mockResolvedValue({
              counselorId: counselorProfileId,
            });

            const updatedAppointment = createMockAppointment({
              ...existingAppointment,
              status: AppointmentStatus.IN_PROGRESS,
            });
            repository.update.mockResolvedValue(updatedAppointment);

            const result = await service.start(userId, appointmentId);

            // Verify update was called with IN_PROGRESS status
            expect(repository.update).toHaveBeenCalledWith(
              appointmentId,
              expect.objectContaining({
                status: AppointmentStatus.IN_PROGRESS,
              }),
            );

            expect(result.data.status).toBe(AppointmentStatus.IN_PROGRESS);

            repository.findById.mockClear();
            repository.update.mockClear();
            prisma.user.findUnique.mockClear();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('complete → COMPLETED', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId (counselor's user id)
          fc.uuid(), // appointmentId
          fc.uuid(), // counselorProfileId
          async (userId, appointmentId, counselorProfileId) => {
            const existingAppointment = createMockAppointment({
              id: appointmentId,
              counselorId: counselorProfileId,
              status: AppointmentStatus.IN_PROGRESS,
            });

            repository.findById.mockResolvedValue(existingAppointment);
            prisma.user.findUnique.mockResolvedValue({
              counselorId: counselorProfileId,
            });

            const updatedAppointment = createMockAppointment({
              ...existingAppointment,
              status: AppointmentStatus.COMPLETED,
            });
            repository.update.mockResolvedValue(updatedAppointment);

            const result = await service.complete(userId, appointmentId);

            // Verify update was called with COMPLETED status
            expect(repository.update).toHaveBeenCalledWith(
              appointmentId,
              expect.objectContaining({
                status: AppointmentStatus.COMPLETED,
              }),
            );

            expect(result.data.status).toBe(AppointmentStatus.COMPLETED);

            repository.findById.mockClear();
            repository.update.mockClear();
            prisma.user.findUnique.mockClear();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('confirmReschedule → CONFIRMED', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId (counselor's user id)
          fc.uuid(), // appointmentId
          fc.uuid(), // counselorProfileId
          async (userId, appointmentId, counselorProfileId) => {
            const existingAppointment = createMockAppointment({
              id: appointmentId,
              counselorId: counselorProfileId,
              status: AppointmentStatus.PENDING_RESCHEDULE,
            });

            repository.findById.mockResolvedValue(existingAppointment);
            prisma.user.findUnique.mockResolvedValue({
              counselorId: counselorProfileId,
            });

            const updatedAppointment = createMockAppointment({
              ...existingAppointment,
              status: AppointmentStatus.CONFIRMED,
            });
            repository.update.mockResolvedValue(updatedAppointment);

            const result = await service.confirmReschedule(
              userId,
              appointmentId,
              {},
            );

            // Verify update was called with CONFIRMED status
            expect(repository.update).toHaveBeenCalledWith(
              appointmentId,
              expect.objectContaining({
                status: AppointmentStatus.CONFIRMED,
              }),
            );

            expect(result.data.status).toBe(AppointmentStatus.CONFIRMED);

            repository.findById.mockClear();
            repository.update.mockClear();
            prisma.user.findUnique.mockClear();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejectReschedule → REJECTED_SCHEDULE', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId (counselor's user id)
          fc.uuid(), // appointmentId
          fc.uuid(), // counselorProfileId
          fc.string({ minLength: 3, maxLength: 100 }), // reason
          async (userId, appointmentId, counselorProfileId, reason) => {
            const existingAppointment = createMockAppointment({
              id: appointmentId,
              counselorId: counselorProfileId,
              status: AppointmentStatus.PENDING_RESCHEDULE,
              notes: null,
            });

            repository.findById.mockResolvedValue(existingAppointment);
            prisma.user.findUnique.mockResolvedValue({
              counselorId: counselorProfileId,
            });

            const updatedAppointment = createMockAppointment({
              ...existingAppointment,
              status: AppointmentStatus.REJECTED_SCHEDULE,
            });
            repository.update.mockResolvedValue(updatedAppointment);

            const result = await service.rejectReschedule(
              userId,
              appointmentId,
              { reason },
            );

            // Verify update was called with REJECTED_SCHEDULE status
            expect(repository.update).toHaveBeenCalledWith(
              appointmentId,
              expect.objectContaining({
                status: AppointmentStatus.REJECTED_SCHEDULE,
              }),
            );

            expect(result.data.status).toBe(
              AppointmentStatus.REJECTED_SCHEDULE,
            );

            repository.findById.mockClear();
            repository.update.mockClear();
            prisma.user.findUnique.mockClear();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
