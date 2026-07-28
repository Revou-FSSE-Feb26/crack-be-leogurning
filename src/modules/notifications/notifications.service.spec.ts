import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import * as fc from 'fast-check';

/**
 * Feature: backend-api
 * Property-based tests for Notifications module
 * Validates: Requirements 10.1, 10.3
 */

describe('NotificationsService - Property-Based Tests', () => {
  let service: NotificationsService;
  let notificationsRepository: jest.Mocked<NotificationsRepository>;

  beforeEach(async () => {
    const mockNotificationsRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsRepository,
          useValue: mockNotificationsRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationsRepository = module.get(
      NotificationsRepository,
    ) as jest.Mocked<NotificationsRepository>;
  });

  /**
   * Feature: backend-api, Property 12: Notification Ownership and Ordering
   * Validates: Requirements 10.1
   *
   * For any authenticated user, the notifications list endpoint SHALL return
   * only notifications where userId matches the authenticated user's ID,
   * sorted by createdAt in descending order.
   */
  describe('Property 12: Notification Ownership and Ordering', () => {
    it('returned notifications are sorted by createdAt in descending order and repository is called with correct userId', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.integer({ min: 1, max: 10 }), // page
          fc.integer({ min: 1, max: 50 }), // limit
          fc.array(
            fc.record({
              id: fc.uuid(),
              userId: fc.constant('placeholder'), // will be overridden
              type: fc.constant('GENERAL' as const),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              message: fc.string({ minLength: 1, maxLength: 200 }),
              isRead: fc.boolean(),
              createdAt: fc
                .integer({ min: 1577836800000, max: 1767139200000 })
                .map((ts) => new Date(ts)),
              updatedAt: fc
                .integer({ min: 1577836800000, max: 1767139200000 })
                .map((ts) => new Date(ts)),
            }),
            { minLength: 0, maxLength: 20 },
          ),
          async (userId, page, limit, rawNotifications) => {
            // Reset mocks
            notificationsRepository.findAll.mockReset();

            // Assign the correct userId to all notifications and sort by createdAt DESC
            const notifications = rawNotifications
              .map((n) => ({ ...n, userId }))
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            // Mock repository to return sorted notifications (as it would from DB)
            notificationsRepository.findAll.mockResolvedValue({
              notifications,
              total: notifications.length,
            });

            // Call service
            const result = await service.findAll(userId, { page, limit });

            // Verify repository was called with the correct userId
            expect(notificationsRepository.findAll).toHaveBeenCalledWith({
              userId,
              page,
              limit,
            });

            // Verify ALL returned notifications have createdAt in descending order
            const dates = result.data.map((n) =>
              new Date(n.createdAt).getTime(),
            );
            for (let i = 1; i < dates.length; i++) {
              expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
            }

            // Verify all returned notifications belong to the user
            for (const n of result.data) {
              expect(n.userId).toBe(userId);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: backend-api, Property 13: Mark-All-Read Completeness
   * Validates: Requirements 10.3
   *
   * After calling mark-all-read, the service SHALL return { success: true }
   * and repository.markAllRead SHALL be called with the correct userId.
   */
  describe('Property 13: Mark-All-Read Completeness', () => {
    it('markAllRead calls repository with correct userId and returns success response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          async (userId) => {
            // Reset mocks
            notificationsRepository.markAllRead.mockReset();

            // Mock markAllRead to resolve successfully
            notificationsRepository.markAllRead.mockResolvedValue({
              count: 5,
            } as any);

            // Call service
            const result = await service.markAllRead(userId);

            // Verify repository.markAllRead was called with the correct userId
            expect(notificationsRepository.markAllRead).toHaveBeenCalledWith(
              userId,
            );

            // Verify the response shape
            expect(result).toEqual({
              success: true,
              message: 'All notifications marked as read',
              data: null,
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it('markRead with notification belonging to a different user throws ForbiddenException', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // authenticated userId
          fc.uuid(), // different userId (notification owner)
          fc.uuid(), // notificationId
          async (authenticatedUserId, ownerUserId, notificationId) => {
            // Ensure the two userIds are different
            if (authenticatedUserId === ownerUserId) return;

            // Reset mocks
            notificationsRepository.findById.mockReset();
            notificationsRepository.markRead.mockReset();

            // Mock notification owned by a different user
            const notification = {
              id: notificationId,
              userId: ownerUserId,
              type: 'GENERAL',
              title: 'Test',
              message: 'Test message',
              isRead: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            notificationsRepository.findById.mockResolvedValue(
              notification as any,
            );

            // Call markRead with the authenticated user (who does NOT own the notification)
            await expect(
              service.markRead(authenticatedUserId, notificationId),
            ).rejects.toThrow(ForbiddenException);

            // Verify markRead was NOT called on the repository
            expect(notificationsRepository.markRead).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
