import { Test, TestingModule } from '@nestjs/testing';
import { SpecializationsService } from './specializations.service';
import { SpecializationsRepository } from './specializations.repository';
import { ConflictException } from '@nestjs/common';
import * as fc from 'fast-check';
import { Specialization } from '@prisma/client';

/**
 * Feature: backend-api
 * Property-based tests for Specializations module
 * Validates: Requirements 7.5
 */

// Helper to create a mock Specialization entity
function createMockSpecialization(
  overrides: Partial<Specialization> = {},
): Specialization {
  return {
    id: overrides.id ?? 'spec-id-1',
    name: overrides.name ?? 'Test Specialization',
    description: overrides.description ?? 'A test description',
    createdBy: overrides.createdBy ?? 'user-id-1',
    updatedBy: overrides.updatedBy ?? 'user-id-1',
    createdAt: overrides.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
  };
}

describe('SpecializationsService - Property-Based Tests', () => {
  let service: SpecializationsService;
  let repository: jest.Mocked<SpecializationsRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpecializationsService,
        { provide: SpecializationsRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<SpecializationsService>(SpecializationsService);
    repository = module.get(
      SpecializationsRepository,
    ) as jest.Mocked<SpecializationsRepository>;
  });

  /**
   * Feature: backend-api, Property 11: Uniqueness Constraint Enforcement
   * Validates: Requirements 7.5
   *
   * For any entity with a uniqueness constraint (Specialization.name),
   * attempting to create a duplicate SHALL return a 409 Conflict response
   * and not modify existing data.
   */
  describe('Property 11: Uniqueness Constraint Enforcement', () => {
    it('duplicate name creation returns 409 and repository.create is never called', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }), // random specialization name
          fc.uuid(), // userId
          fc.option(fc.string({ minLength: 1, maxLength: 255 }), {
            nil: undefined,
          }), // optional description
          async (name, userId, description) => {
            // Mock findByName to return an existing specialization (simulating duplicate)
            const existingSpecialization = createMockSpecialization({
              name,
              createdBy: 'some-other-user',
            });
            repository.findByName.mockResolvedValue(existingSpecialization);

            // Attempt to create with the duplicate name
            await expect(
              service.create({ name, description, userId }),
            ).rejects.toThrow(ConflictException);

            // Verify that repository.create was NOT called
            expect(repository.create).not.toHaveBeenCalled();

            // Reset mocks for next iteration
            repository.findByName.mockReset();
            repository.create.mockReset();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
