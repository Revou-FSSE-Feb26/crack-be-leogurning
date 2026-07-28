import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fc from 'fast-check';

/**
 * Feature: backend-api
 * Property 14: Dashboard Aggregation Correctness
 * Validates: Requirements 11.1, 11.2, 11.3
 */

describe('DashboardService - Property-Based Tests', () => {
  let service: DashboardService;
  let dashboardRepository: jest.Mocked<DashboardRepository>;
  let prismaService: { user: { findUnique: jest.Mock } };

  beforeEach(async () => {
    const mockDashboardRepository = {
      getClientUpcomingCount: jest.fn(),
      getClientCompletedCount: jest.fn(),
      getClientNextSession: jest.fn(),
      getCounselorPendingCount: jest.fn(),
      getCounselorTodayCount: jest.fn(),
      getCounselorThisMonthCount: jest.fn(),
      getCounselorRating: jest.fn(),
      getAdminUserStats: jest.fn(),
      getAdminPaymentStats: jest.fn(),
      getAdminAppointmentStats: jest.fn(),
    };

    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: DashboardRepository,
          useValue: mockDashboardRepository,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    dashboardRepository = module.get(
      DashboardRepository,
    ) as jest.Mocked<DashboardRepository>;
    prismaService = module.get(PrismaService) as any;
  });

  /**
   * Feature: backend-api, Property 14: Dashboard Aggregation Correctness
   * Validates: Requirements 11.1
   *
   * Client Dashboard: For any client user, the returned upcomingCount and completedCount
   * SHALL exactly match the values returned by the corresponding repository aggregation methods.
   */
  describe('Property 14 - Client Dashboard Aggregation Correctness', () => {
    it('client dashboard returns counts unchanged from repository', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.nat({ max: 1000 }), // upcomingCount
          fc.nat({ max: 1000 }), // completedCount
          async (userId, upcomingCount, completedCount) => {
            // Reset mocks
            dashboardRepository.getClientUpcomingCount.mockReset();
            dashboardRepository.getClientCompletedCount.mockReset();
            dashboardRepository.getClientNextSession.mockReset();

            // Mock repository to return the generated counts
            dashboardRepository.getClientUpcomingCount.mockResolvedValue(
              upcomingCount,
            );
            dashboardRepository.getClientCompletedCount.mockResolvedValue(
              completedCount,
            );
            dashboardRepository.getClientNextSession.mockResolvedValue(null);

            // Call service
            const result = await service.clientDashboard(userId);

            // Key invariant: service forwards repository values unchanged
            expect(result.upcomingCount).toBe(upcomingCount);
            expect(result.completedCount).toBe(completedCount);
            expect(result.nextSession).toBeNull();

            // Verify repository was called with the correct userId
            expect(
              dashboardRepository.getClientUpcomingCount,
            ).toHaveBeenCalledWith(userId);
            expect(
              dashboardRepository.getClientCompletedCount,
            ).toHaveBeenCalledWith(userId);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: backend-api, Property 14: Dashboard Aggregation Correctness
   * Validates: Requirements 11.2
   *
   * Counselor Dashboard: For any counselor user, the returned pending, today, thisMonth,
   * and rating counts SHALL exactly match the values returned by the corresponding
   * repository aggregation methods.
   */
  describe('Property 14 - Counselor Dashboard Aggregation Correctness', () => {
    it('counselor dashboard returns counts unchanged from repository', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.uuid(), // counselorId
          fc.nat({ max: 1000 }), // pending
          fc.nat({ max: 100 }), // today
          fc.nat({ max: 500 }), // thisMonth
          fc.float({ min: 0, max: 5, noNaN: true }), // rating
          async (userId, counselorId, pending, today, thisMonth, rating) => {
            // Reset mocks
            prismaService.user.findUnique.mockReset();
            dashboardRepository.getCounselorPendingCount.mockReset();
            dashboardRepository.getCounselorTodayCount.mockReset();
            dashboardRepository.getCounselorThisMonthCount.mockReset();
            dashboardRepository.getCounselorRating.mockReset();

            // Mock prisma.user.findUnique to return a counselorId
            prismaService.user.findUnique.mockResolvedValue({
              counselorId,
            });

            // Mock repository to return the generated counts
            dashboardRepository.getCounselorPendingCount.mockResolvedValue(
              pending,
            );
            dashboardRepository.getCounselorTodayCount.mockResolvedValue(today);
            dashboardRepository.getCounselorThisMonthCount.mockResolvedValue(
              thisMonth,
            );
            dashboardRepository.getCounselorRating.mockResolvedValue(rating);

            // Call service
            const result = await service.counselorDashboard(userId);

            // Key invariant: service forwards repository values unchanged
            expect(result.pending).toBe(pending);
            expect(result.today).toBe(today);
            expect(result.thisMonth).toBe(thisMonth);
            expect(result.rating).toBe(rating);

            // Verify prisma was called with correct userId for lookup
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
              where: { id: userId },
              select: { counselorId: true },
            });

            // Verify repository methods were called with the counselorId (not userId)
            expect(
              dashboardRepository.getCounselorPendingCount,
            ).toHaveBeenCalledWith(counselorId);
            expect(
              dashboardRepository.getCounselorTodayCount,
            ).toHaveBeenCalledWith(counselorId);
            expect(
              dashboardRepository.getCounselorThisMonthCount,
            ).toHaveBeenCalledWith(counselorId);
            expect(
              dashboardRepository.getCounselorRating,
            ).toHaveBeenCalledWith(counselorId);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('counselor dashboard throws NotFoundException when counselorId is missing', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          // Reset mocks
          prismaService.user.findUnique.mockReset();

          // Mock user without a counselorId
          prismaService.user.findUnique.mockResolvedValue({
            counselorId: null,
          });

          // Should throw NotFoundException
          await expect(service.counselorDashboard(userId)).rejects.toThrow(
            NotFoundException,
          );
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: backend-api, Property 14: Dashboard Aggregation Correctness
   * Validates: Requirements 11.3
   *
   * Admin Dashboard: The returned userStats, paymentStats, and appointmentStats
   * SHALL exactly match the objects returned by the corresponding repository
   * aggregation methods with no data corruption.
   */
  describe('Property 14 - Admin Dashboard Aggregation Correctness', () => {
    it('admin dashboard returns stats objects unchanged from repository', async () => {
      await fc.assert(
        fc.asyncProperty(
          // userStats
          fc.record({
            totalClients: fc.nat({ max: 10000 }),
            counselors: fc.nat({ max: 1000 }),
            today: fc.nat({ max: 100 }),
            thisMonth: fc.nat({ max: 1000 }),
          }),
          // paymentStats
          fc.record({
            pendingVerify: fc.nat({ max: 500 }),
            verified: fc.nat({ max: 5000 }),
            rejected: fc.nat({ max: 500 }),
            revenue: fc.nat({ max: 100000000 }),
          }),
          // appointmentStats
          fc.record({
            pending: fc.nat({ max: 1000 }),
            confirmed: fc.nat({ max: 2000 }),
            completed: fc.nat({ max: 10000 }),
            cancelled: fc.nat({ max: 1000 }),
          }),
          async (userStats, paymentStats, appointmentStats) => {
            // Reset mocks
            dashboardRepository.getAdminUserStats.mockReset();
            dashboardRepository.getAdminPaymentStats.mockReset();
            dashboardRepository.getAdminAppointmentStats.mockReset();

            // Mock repository to return the generated stats
            dashboardRepository.getAdminUserStats.mockResolvedValue(userStats);
            dashboardRepository.getAdminPaymentStats.mockResolvedValue(
              paymentStats,
            );
            dashboardRepository.getAdminAppointmentStats.mockResolvedValue(
              appointmentStats,
            );

            // Call service
            const result = await service.adminDashboard();

            // Key invariant: service forwards repository values unchanged
            expect(result.userStats).toEqual(userStats);
            expect(result.paymentStats).toEqual(paymentStats);
            expect(result.appointmentStats).toEqual(appointmentStats);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
