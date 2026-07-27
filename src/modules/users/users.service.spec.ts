import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import * as fc from 'fast-check';
import { Role, User } from '@prisma/client';

/**
 * Feature: backend-api
 * Property-based tests for Users module
 * Validates: Requirements 1.1, 1.4, 1.6
 */

// Helper to create a mock User entity
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: overrides.id ?? 'user-id-1',
    email: overrides.email ?? 'test@example.com',
    password: overrides.password ?? 'hashed-password',
    fullName: overrides.fullName ?? 'Test User',
    phone: overrides.phone ?? '+6281234567890',
    dateOfBirth: overrides.dateOfBirth ?? new Date('1990-01-01'),
    emergencyContact: overrides.emergencyContact ?? '+6289876543210',
    avatarUrl: overrides.avatarUrl ?? null,
    role: overrides.role ?? Role.CLIENT,
    isActive: overrides.isActive ?? true,
    counselorId: overrides.counselorId ?? null,
    refreshToken: overrides.refreshToken ?? null,
    createdAt: overrides.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
  };
}

describe('UsersService - Property-Based Tests', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      toggleActive: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository) as jest.Mocked<UsersRepository>;
  });

  /**
   * Feature: backend-api, Property 4: Pagination Invariants
   * Validates: Requirements 1.1
   *
   * For any paginated response:
   * - meta.totalPages equals Math.ceil(meta.total / meta.limit)
   * - data.length is less than or equal to meta.limit
   * - meta.page equals the requested page number
   * - If meta.total > 0 and meta.page <= meta.totalPages, then data.length > 0
   */
  describe('Property 4: Pagination Invariants', () => {
    it('totalPages = ceil(total/limit), data.length <= limit, meta.page = requested page', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 50 }), // page
          fc.integer({ min: 1, max: 100 }), // limit
          fc.integer({ min: 0, max: 500 }), // total items in DB
          async (page, limit, total) => {
            // Calculate how many items should be on this page
            const totalPages = Math.ceil(total / limit);
            const isValidPage = page <= totalPages && total > 0;
            const itemsOnPage = isValidPage
              ? Math.min(limit, total - (page - 1) * limit)
              : 0;

            // Generate mock users for this page
            const users: User[] = Array.from({ length: itemsOnPage }, (_, i) =>
              createMockUser({ id: `user-${page}-${i}` }),
            );

            repository.findAll.mockResolvedValue({ users, total });

            const result = await service.findAll({ page, limit });

            // Invariant 1: totalPages = ceil(total / limit)
            expect(result.meta.totalPages).toBe(Math.ceil(total / limit));

            // Invariant 2: data.length <= limit
            expect(result.data.length).toBeLessThanOrEqual(limit);

            // Invariant 3: meta.page = requested page
            expect(result.meta.page).toBe(page);

            // Invariant 4: If total > 0 and page <= totalPages, then data.length > 0
            if (total > 0 && page <= totalPages) {
              expect(result.data.length).toBeGreaterThan(0);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: backend-api, Property 5: Toggle-Active Involution
   * Validates: Requirements 1.4
   *
   * For any user, calling toggleActive twice in succession returns
   * the user to their original isActive state.
   */
  describe('Property 5: Toggle-Active Involution', () => {
    it('double toggle returns user to original isActive state', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(), // initial isActive state
          fc.uuid(), // user ID
          async (initialIsActive, userId) => {
            const originalUser = createMockUser({
              id: userId,
              isActive: initialIsActive,
            });

            // After first toggle: isActive is flipped
            const afterFirstToggle = createMockUser({
              id: userId,
              isActive: !initialIsActive,
            });

            // After second toggle: isActive returns to original
            const afterSecondToggle = createMockUser({
              id: userId,
              isActive: initialIsActive,
            });

            // First toggle call
            repository.findById.mockResolvedValueOnce(originalUser);
            repository.toggleActive.mockResolvedValueOnce(afterFirstToggle);

            const firstResult = await service.toggleActive(userId);
            expect(firstResult.data.isActive).toBe(!initialIsActive);

            // Second toggle call
            repository.findById.mockResolvedValueOnce(afterFirstToggle);
            repository.toggleActive.mockResolvedValueOnce(afterSecondToggle);

            const secondResult = await service.toggleActive(userId);
            expect(secondResult.data.isActive).toBe(initialIsActive);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: backend-api, Property 6: Update-Read Round Trip
   * Validates: Requirements 1.6
   *
   * For any valid update DTO applied to a user profile,
   * a subsequent read reflects all updated fields.
   */
  describe('Property 6: Update-Read Round Trip', () => {
    it('update then read reflects all updated fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.record({
            fullName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
              nil: undefined,
            }),
            phone: fc.option(
              fc.string({ minLength: 10, maxLength: 15 }).map(
                (s) => '+62' + s.replace(/[^0-9]/g, '').slice(0, 12),
              ),
              { nil: undefined },
            ),
            dateOfBirth: fc.option(
              fc
                .date({
                  min: new Date('1950-01-01'),
                  max: new Date('2005-12-31'),
                })
                .map((d) => d.toISOString().split('T')[0]),
              { nil: undefined },
            ),
            emergencyContact: fc.option(
              fc.string({ minLength: 10, maxLength: 15 }).map(
                (s) => '+62' + s.replace(/[^0-9]/g, '').slice(0, 12),
              ),
              { nil: undefined },
            ),
          }),
          async (userId, updateDto) => {
            // Filter out undefined fields to get the actual update
            const definedFields: Record<string, any> = {};
            if (updateDto.fullName !== undefined)
              definedFields.fullName = updateDto.fullName;
            if (updateDto.phone !== undefined)
              definedFields.phone = updateDto.phone;
            if (updateDto.dateOfBirth !== undefined)
              definedFields.dateOfBirth = updateDto.dateOfBirth;
            if (updateDto.emergencyContact !== undefined)
              definedFields.emergencyContact = updateDto.emergencyContact;

            const originalUser = createMockUser({ id: userId });

            // Construct the updated user based on the DTO
            const updatedUser = createMockUser({
              id: userId,
              fullName:
                definedFields.fullName !== undefined
                  ? definedFields.fullName
                  : originalUser.fullName,
              phone:
                definedFields.phone !== undefined
                  ? definedFields.phone
                  : originalUser.phone,
              dateOfBirth:
                definedFields.dateOfBirth !== undefined
                  ? new Date(definedFields.dateOfBirth)
                  : originalUser.dateOfBirth,
              emergencyContact:
                definedFields.emergencyContact !== undefined
                  ? definedFields.emergencyContact
                  : originalUser.emergencyContact,
            });

            // Mock: findById returns original for the update check
            repository.findById.mockResolvedValueOnce(originalUser);
            // Mock: update returns the updated user
            repository.update.mockResolvedValueOnce(updatedUser);

            const updateResult = await service.updateMe(userId, updateDto);

            // Verify all fields in updateDto that were defined are reflected
            if (definedFields.fullName !== undefined) {
              expect(updateResult.data.fullName).toBe(definedFields.fullName);
            }
            if (definedFields.phone !== undefined) {
              expect(updateResult.data.phone).toBe(definedFields.phone);
            }
            if (definedFields.dateOfBirth !== undefined) {
              expect(updateResult.data.dateOfBirth).toBe(
                new Date(definedFields.dateOfBirth).toISOString(),
              );
            }
            if (definedFields.emergencyContact !== undefined) {
              expect(updateResult.data.emergencyContact).toBe(
                definedFields.emergencyContact,
              );
            }

            // Now simulate a read (getMe) and verify the same data
            repository.findById.mockResolvedValueOnce(updatedUser);
            const readResult = await service.getMe(userId);

            if (definedFields.fullName !== undefined) {
              expect(readResult.fullName).toBe(definedFields.fullName);
            }
            if (definedFields.phone !== undefined) {
              expect(readResult.phone).toBe(definedFields.phone);
            }
            if (definedFields.dateOfBirth !== undefined) {
              expect(readResult.dateOfBirth).toBe(
                new Date(definedFields.dateOfBirth).toISOString(),
              );
            }
            if (definedFields.emergencyContact !== undefined) {
              expect(readResult.emergencyContact).toBe(
                definedFields.emergencyContact,
              );
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
