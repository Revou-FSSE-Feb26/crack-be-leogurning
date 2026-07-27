import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { PaymentProofsService } from './payment-proofs.service';
import { PaymentProofsRepository } from './payment-proofs.repository';
import { AppointmentsRepository } from 'src/modules/appointments/appointments.repository';
import { PaymentProofStatus, AppointmentStatus } from '@prisma/client';
import * as fc from 'fast-check';

/**
 * Feature: backend-api
 * Property-based tests for Payment Proofs module
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */

describe('PaymentProofsService - Property-Based Tests', () => {
  let service: PaymentProofsService;
  let paymentProofsRepository: jest.Mocked<PaymentProofsRepository>;
  let appointmentsRepository: jest.Mocked<AppointmentsRepository>;

  const mockFile = { filename: 'test-file.jpg' } as Express.Multer.File;

  beforeEach(async () => {
    const mockPaymentProofsRepository = {
      findById: jest.fn(),
      findByAppointmentId: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
    };

    const mockAppointmentsRepository = {
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentProofsService,
        {
          provide: PaymentProofsRepository,
          useValue: mockPaymentProofsRepository,
        },
        {
          provide: AppointmentsRepository,
          useValue: mockAppointmentsRepository,
        },
      ],
    }).compile();

    service = module.get<PaymentProofsService>(PaymentProofsService);
    paymentProofsRepository = module.get(
      PaymentProofsRepository,
    ) as jest.Mocked<PaymentProofsRepository>;
    appointmentsRepository = module.get(
      AppointmentsRepository,
    ) as jest.Mocked<AppointmentsRepository>;
  });

  /**
   * Feature: backend-api, Property 15: Payment Action Atomicity
   * Validates: Requirements 6.1, 6.2, 6.3
   *
   * For any payment proof action (create, verify, reject), both the PaymentProof
   * status and the associated Appointment status SHALL update atomically:
   * - Create: proof is created, appointment status → PAYMENT_UPLOADED
   * - Verify: proof.status → VERIFIED, appointment.status → PAYMENT_VERIFIED
   * - Reject: proof.status → REJECTED, proof.rejectionReason is set, appointment.status → AWAITING_PAYMENT
   */
  describe('Property 15: Payment Action Atomicity', () => {
    it('create: proof is created and appointment status → PAYMENT_UPLOADED', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.uuid(), // appointmentId
          async (userId, appointmentId) => {
            // Reset mocks
            paymentProofsRepository.findByAppointmentId.mockReset();
            paymentProofsRepository.create.mockReset();
            appointmentsRepository.update.mockReset();

            // Mock no existing proof
            paymentProofsRepository.findByAppointmentId.mockResolvedValue(null);

            // Mock create returns new proof
            const createdProof = {
              id: 'proof-id',
              appointmentId,
              filename: mockFile.filename,
              submittedAt: new Date(),
              status: PaymentProofStatus.SUBMITTED,
              rejectionReason: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: userId,
              updatedBy: userId,
            };
            paymentProofsRepository.create.mockResolvedValue(createdProof);

            // Mock appointment update
            appointmentsRepository.update.mockResolvedValue({} as any);

            // Execute
            const result = await service.create(
              userId,
              { appointmentId },
              mockFile,
            );

            // Verify proof was created with correct appointmentId
            expect(paymentProofsRepository.create).toHaveBeenCalledWith(
              expect.objectContaining({
                appointmentId,
                filename: mockFile.filename,
              }),
            );

            // Verify appointment status updated to PAYMENT_UPLOADED
            expect(appointmentsRepository.update).toHaveBeenCalledWith(
              appointmentId,
              expect.objectContaining({
                status: AppointmentStatus.PAYMENT_UPLOADED,
              }),
            );

            // Verify response shape
            expect(result.success).toBe(true);
            expect(result.data.appointmentId).toBe(appointmentId);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('verify: proof.status → VERIFIED and appointment.status → PAYMENT_VERIFIED', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // proofId
          fc.uuid(), // appointmentId
          async (proofId, appointmentId) => {
            // Reset mocks
            paymentProofsRepository.findById.mockReset();
            paymentProofsRepository.updateStatus.mockReset();
            appointmentsRepository.update.mockReset();

            // Mock existing proof
            const existingProof = {
              id: proofId,
              appointmentId,
              filename: 'proof.jpg',
              submittedAt: new Date(),
              status: PaymentProofStatus.SUBMITTED,
              rejectionReason: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: 'user-1',
              updatedBy: 'user-1',
            };
            paymentProofsRepository.findById.mockResolvedValue(existingProof);

            // Mock updateStatus returns updated proof
            const updatedProof = {
              ...existingProof,
              status: PaymentProofStatus.VERIFIED,
            };
            paymentProofsRepository.updateStatus.mockResolvedValue(
              updatedProof,
            );

            // Mock appointment update
            appointmentsRepository.update.mockResolvedValue({} as any);

            // Execute
            const result = await service.verify(proofId);

            // Verify proof status updated to VERIFIED
            expect(paymentProofsRepository.updateStatus).toHaveBeenCalledWith(
              proofId,
              expect.objectContaining({
                status: PaymentProofStatus.VERIFIED,
              }),
            );

            // Verify appointment status updated to PAYMENT_VERIFIED
            expect(appointmentsRepository.update).toHaveBeenCalledWith(
              appointmentId,
              expect.objectContaining({
                status: AppointmentStatus.PAYMENT_VERIFIED,
              }),
            );

            // Verify response shape
            expect(result.success).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('reject: proof.status → REJECTED, rejectionReason is set, appointment.status → AWAITING_PAYMENT', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // proofId
          fc.uuid(), // appointmentId
          fc.string({ minLength: 1, maxLength: 200 }), // rejectionReason
          async (proofId, appointmentId, rejectionReason) => {
            // Reset mocks
            paymentProofsRepository.findById.mockReset();
            paymentProofsRepository.updateStatus.mockReset();
            appointmentsRepository.update.mockReset();

            // Mock existing proof
            const existingProof = {
              id: proofId,
              appointmentId,
              filename: 'proof.jpg',
              submittedAt: new Date(),
              status: PaymentProofStatus.SUBMITTED,
              rejectionReason: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: 'user-1',
              updatedBy: 'user-1',
            };
            paymentProofsRepository.findById.mockResolvedValue(existingProof);

            // Mock updateStatus returns updated proof with rejection
            const updatedProof = {
              ...existingProof,
              status: PaymentProofStatus.REJECTED,
              rejectionReason,
            };
            paymentProofsRepository.updateStatus.mockResolvedValue(
              updatedProof,
            );

            // Mock appointment update
            appointmentsRepository.update.mockResolvedValue({} as any);

            // Execute
            const result = await service.reject(proofId, { rejectionReason });

            // Verify proof status updated to REJECTED with reason
            expect(paymentProofsRepository.updateStatus).toHaveBeenCalledWith(
              proofId,
              expect.objectContaining({
                status: PaymentProofStatus.REJECTED,
                rejectionReason,
              }),
            );

            // Verify appointment status updated to AWAITING_PAYMENT
            expect(appointmentsRepository.update).toHaveBeenCalledWith(
              appointmentId,
              expect.objectContaining({
                status: AppointmentStatus.AWAITING_PAYMENT,
              }),
            );

            // Verify response includes rejectionReason
            expect(result.success).toBe(true);
            expect(result.data.rejectionReason).toBe(rejectionReason);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: backend-api, Property 11: Uniqueness Constraint Enforcement
   * Validates: Requirements 6.4
   *
   * For any appointmentId where a payment proof already exists, attempting to
   * create another SHALL return a 409 Conflict.
   */
  describe('Property 11: Uniqueness Constraint Enforcement', () => {
    it('duplicate appointmentId returns 409 ConflictException', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.uuid(), // appointmentId
          async (userId, appointmentId) => {
            // Reset mocks
            paymentProofsRepository.findByAppointmentId.mockReset();
            paymentProofsRepository.create.mockReset();

            // Mock existing proof already exists for this appointmentId
            const existingProof = {
              id: 'existing-proof-id',
              appointmentId,
              filename: 'existing-proof.jpg',
              submittedAt: new Date(),
              status: PaymentProofStatus.SUBMITTED,
              rejectionReason: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: 'other-user',
              updatedBy: 'other-user',
            };
            paymentProofsRepository.findByAppointmentId.mockResolvedValue(
              existingProof,
            );

            // Attempt to create another proof for the same appointment
            await expect(
              service.create(userId, { appointmentId }, mockFile),
            ).rejects.toThrow(ConflictException);

            // Verify create was NOT called
            expect(paymentProofsRepository.create).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
