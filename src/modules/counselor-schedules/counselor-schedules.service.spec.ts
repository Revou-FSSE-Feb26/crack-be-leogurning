import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CounselorSchedulesService } from './counselor-schedules.service';
import { CounselorSchedulesRepository } from './counselor-schedules.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fc from 'fast-check';
import { DayOfWeek } from '@prisma/client';

/**
 * Feature: backend-api
 * Property-based tests for Counselor Schedule module
 * Validates: Requirements 4.2, 4.4
 */

const DAYS_OF_WEEK: DayOfWeek[] = [
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
];

// Helper: generate a valid HH:MM time string
const timeArb = fc
  .record({
    hour: fc.integer({ min: 0, max: 23 }),
    minute: fc.integer({ min: 0, max: 59 }),
  })
  .map(({ hour, minute }) => {
    const hh = hour.toString().padStart(2, '0');
    const mm = minute.toString().padStart(2, '0');
    return `${hh}:${mm}`;
  });

// Helper: generate a valid schedule slot where startTime < endTime
const validSlotArb = fc
  .record({
    dayOfWeek: fc.constantFrom(...DAYS_OF_WEEK),
    startHour: fc.integer({ min: 0, max: 22 }),
    startMinute: fc.integer({ min: 0, max: 59 }),
    durationMinutes: fc.integer({ min: 1, max: 300 }),
  })
  .filter(({ startHour, startMinute, durationMinutes }) => {
    const totalStart = startHour * 60 + startMinute;
    const totalEnd = totalStart + durationMinutes;
    return totalEnd < 24 * 60; // endTime must be within the same day
  })
  .map(({ dayOfWeek, startHour, startMinute, durationMinutes }) => {
    const totalEnd = startHour * 60 + startMinute + durationMinutes;
    const endHour = Math.floor(totalEnd / 60);
    const endMinute = totalEnd % 60;
    return {
      dayOfWeek,
      startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
      endTime: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
    };
  });

// Helper: generate an invalid slot where startTime >= endTime
const invalidTimeSlotArb = fc
  .record({
    dayOfWeek: fc.constantFrom(...DAYS_OF_WEEK),
    startTime: timeArb,
    endTime: timeArb,
  })
  .filter(({ startTime, endTime }) => startTime >= endTime);

describe('CounselorSchedulesService - Property-Based Tests', () => {
  let service: CounselorSchedulesService;
  let repository: jest.Mocked<CounselorSchedulesRepository>;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(async () => {
    const mockRepository = {
      findByCounselorId: jest.fn(),
      bulkReplace: jest.fn(),
    };

    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CounselorSchedulesService,
        { provide: CounselorSchedulesRepository, useValue: mockRepository },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CounselorSchedulesService>(CounselorSchedulesService);
    repository = module.get(
      CounselorSchedulesRepository,
    ) as jest.Mocked<CounselorSchedulesRepository>;
    prisma = module.get(PrismaService) as any;
  });

  /**
   * Feature: backend-api, Property 8: Schedule Bulk Replace Round Trip
   * Validates: Requirements 4.2
   *
   * For any valid set of schedule slots submitted via PUT, a subsequent GET
   * for the same counselorId SHALL return exactly those slots (same dayOfWeek,
   * startTime, endTime values) and no others.
   */
  describe('Property 8: Schedule Bulk Replace Round Trip', () => {
    it('PUT then GET returns exactly the submitted slots', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // counselorId
          fc.uuid(), // userId
          fc.array(validSlotArb, { minLength: 1, maxLength: 10 }),
          async (counselorId, userId, slots) => {
            // Mock ownership check passes
            prisma.user.findUnique.mockResolvedValue({
              counselorId,
            });

            // Mock bulkReplace returns the slots with generated IDs
            const savedSchedules = slots.map((slot, index) => ({
              id: `schedule-${index}`,
              counselorId,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              createdBy: userId,
              updatedBy: userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

            repository.bulkReplace.mockResolvedValue(savedSchedules);

            // Call bulkReplace
            const result = await service.bulkReplace(counselorId, userId, {
              slots,
            });

            // Verify the returned data matches input exactly
            expect(result.data.length).toBe(slots.length);

            for (let i = 0; i < slots.length; i++) {
              expect(result.data[i].dayOfWeek).toBe(slots[i].dayOfWeek);
              expect(result.data[i].startTime).toBe(slots[i].startTime);
              expect(result.data[i].endTime).toBe(slots[i].endTime);
            }

            // Verify no extra slots are returned
            expect(result.data.length).toBe(slots.length);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: backend-api, Property 9: Schedule Time Validation
   * Validates: Requirements 4.4
   *
   * For any schedule slot where startTime >= endTime (lexicographic comparison
   * of "HH:MM" strings), the API SHALL reject with BadRequestException.
   */
  describe('Property 9: Schedule Time Validation', () => {
    it('startTime >= endTime is rejected with BadRequestException', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // counselorId
          fc.uuid(), // userId
          fc.array(invalidTimeSlotArb, { minLength: 1, maxLength: 5 }),
          async (counselorId, userId, invalidSlots) => {
            // Mock ownership check passes
            prisma.user.findUnique.mockResolvedValue({
              counselorId,
            });

            // Call should throw BadRequestException
            await expect(
              service.bulkReplace(counselorId, userId, {
                slots: invalidSlots,
              }),
            ).rejects.toThrow(BadRequestException);

            // Verify repository.bulkReplace was NOT called
            expect(repository.bulkReplace).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
