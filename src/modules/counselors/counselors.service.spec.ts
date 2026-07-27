import { Test, TestingModule } from '@nestjs/testing';
import { CounselorsService } from './counselors.service';
import { CounselorsRepository } from './counselors.repository';
import * as fc from 'fast-check';

/**
 * Feature: backend-api
 * Property-based tests for Counselors module
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6
 */

// Helper to create a mock counselor entity as returned by the repository
function createMockCounselor(
  overrides: {
    id?: string;
    userId?: string;
    fullName?: string;
    licenseNumber?: string;
    specializations?: { id: string; name: string }[];
    sessionTypeConfigs?: {
      sessionType: 'ONLINE' | 'OFFLINE';
      appointmentSessionType: {
        name: string;
        price: number;
        durationMinutes: number;
      };
    }[];
    languages?: string[];
    availability?: string[];
    rating?: number;
    reviewCount?: number;
    isAvailable?: boolean;
  } = {},
) {
  const specializations = overrides.specializations ?? [
    { id: 'spec-1', name: 'Anxiety' },
  ];

  return {
    id: overrides.id ?? 'counselor-1',
    userId: overrides.userId ?? 'user-1',
    user: { fullName: overrides.fullName ?? 'Test Counselor' },
    licenseNumber: overrides.licenseNumber ?? 'LIC-001',
    counselorSpecializations: specializations.map((s) => ({
      specialization: { id: s.id, name: s.name },
    })),
    sessionTypeConfigs: overrides.sessionTypeConfigs ?? [
      {
        sessionType: 'ONLINE' as const,
        appointmentSessionType: {
          name: 'Online Session',
          price: 200000,
          durationMinutes: 60,
        },
      },
    ],
    languages: overrides.languages ?? ['English'],
    availability: overrides.availability ?? ['Monday', 'Wednesday'],
    rating: overrides.rating ?? 4.5,
    reviewCount: overrides.reviewCount ?? 10,
    isAvailable: overrides.isAvailable ?? true,
  };
}

describe('CounselorsService - Property-Based Tests', () => {
  let service: CounselorsService;
  let repository: jest.Mocked<CounselorsRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CounselorsService,
        { provide: CounselorsRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<CounselorsService>(CounselorsService);
    repository = module.get(
      CounselorsRepository,
    ) as jest.Mocked<CounselorsRepository>;
  });

  /**
   * Feature: backend-api, Property 2: Filter Correctness
   * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6
   *
   * For any list endpoint and for any filter parameter (search, specializationId,
   * sessionType, language, price range), all items in the returned `data` array
   * SHALL satisfy the filter condition. Specifically:
   * - Search: item's fullName contains the term (case-insensitive)
   * - specializationId: item's specializations include one linked to that ID
   * - sessionType: item has a session type config matching ONLINE or OFFLINE
   * - language: item's languages array contains the language
   * - Price range: item's session type price falls within [min, max]
   */
  describe('Property 2: Filter Correctness', () => {
    it('search filter: all returned fullName fields contain the search term (case-insensitive)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc
            .string({ minLength: 1, maxLength: 10 })
            .filter((s) => /^[a-zA-Z]+$/.test(s)), // search term
          fc.integer({ min: 1, max: 5 }), // number of counselors
          async (searchTerm, count) => {
            // Generate counselors whose fullName contains the search term
            const matchingCounselors = Array.from({ length: count }, (_, i) =>
              createMockCounselor({
                id: `counselor-${i}`,
                fullName: `Dr ${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase()} Smith${i}`,
              }),
            );

            repository.findAll.mockResolvedValue({
              counselors: matchingCounselors,
              total: count,
            });

            const result = await service.findAll({
              page: 1,
              limit: 10,
              search: searchTerm,
            });

            // Verify all returned items have fullName containing the search term
            for (const item of result.data) {
              expect(
                item.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
              ).toBe(true);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('language filter: all returned items languages array includes the specified language', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc
            .string({ minLength: 3, maxLength: 10 })
            .filter((s) => /^[a-zA-Z]+$/.test(s)), // language
          fc.integer({ min: 1, max: 5 }), // number of counselors
          async (language, count) => {
            // Generate counselors that have the specified language
            const matchingCounselors = Array.from({ length: count }, (_, i) =>
              createMockCounselor({
                id: `counselor-${i}`,
                languages: [language, 'OtherLang'],
              }),
            );

            repository.findAll.mockResolvedValue({
              counselors: matchingCounselors,
              total: count,
            });

            const result = await service.findAll({
              page: 1,
              limit: 10,
              language,
            });

            // Verify all returned items have the specified language
            for (const item of result.data) {
              expect(item.languages).toContain(language);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('sessionType filter: all returned items have a matching session type config', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('ONLINE' as const, 'OFFLINE' as const), // sessionType
          fc.integer({ min: 1, max: 5 }), // number of counselors
          async (sessionType, count) => {
            // Generate counselors that have the specified session type
            const matchingCounselors = Array.from({ length: count }, (_, i) =>
              createMockCounselor({
                id: `counselor-${i}`,
                sessionTypeConfigs: [
                  {
                    sessionType,
                    appointmentSessionType: {
                      name: `${sessionType} Session`,
                      price: 150000,
                      durationMinutes: 60,
                    },
                  },
                ],
              }),
            );

            repository.findAll.mockResolvedValue({
              counselors: matchingCounselors,
              total: count,
            });

            const result = await service.findAll({
              page: 1,
              limit: 10,
              sessionType,
            });

            // Verify all returned items have the expected session type
            for (const item of result.data) {
              if (sessionType === 'ONLINE') {
                expect(item.sessionTypes.online).toBeDefined();
              } else {
                expect(item.sessionTypes.offline).toBeDefined();
              }
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('specializationId filter: all returned items specializations include the filtered specialization', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // specializationId
          fc
            .string({ minLength: 3, maxLength: 15 })
            .filter((s) => /^[a-zA-Z]+$/.test(s)), // specialization name
          fc.integer({ min: 1, max: 5 }), // number of counselors
          async (specializationId, specName, count) => {
            // Generate counselors that have the specified specialization
            const matchingCounselors = Array.from({ length: count }, (_, i) =>
              createMockCounselor({
                id: `counselor-${i}`,
                specializations: [{ id: specializationId, name: specName }],
              }),
            );

            repository.findAll.mockResolvedValue({
              counselors: matchingCounselors,
              total: count,
            });

            const result = await service.findAll({
              page: 1,
              limit: 10,
              specializationId,
            });

            // Verify all returned items have the specialization name in their list
            for (const item of result.data) {
              expect(item.specializations).toContain(specName);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('price range filter: all returned items have a session price within [minPrice, maxPrice]', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 50000, max: 300000 }), // minPrice
          fc.integer({ min: 300001, max: 1000000 }), // maxPrice (always > minPrice)
          fc.integer({ min: 1, max: 5 }), // number of counselors
          async (minPrice, maxPrice, count) => {
            // Generate counselors with prices in range
            const matchingCounselors = Array.from({ length: count }, (_, i) => {
              const price =
                minPrice + Math.floor(((maxPrice - minPrice) / count) * i);
              return createMockCounselor({
                id: `counselor-${i}`,
                sessionTypeConfigs: [
                  {
                    sessionType: 'ONLINE',
                    appointmentSessionType: {
                      name: 'Session',
                      price,
                      durationMinutes: 60,
                    },
                  },
                ],
              });
            });

            repository.findAll.mockResolvedValue({
              counselors: matchingCounselors,
              total: count,
            });

            const result = await service.findAll({
              page: 1,
              limit: 10,
              minPrice,
              maxPrice,
            });

            // Verify all returned items have at least one session type with price in range
            for (const item of result.data) {
              const prices: number[] = [];
              if (item.sessionTypes.online)
                prices.push(item.sessionTypes.online.price);
              if (item.sessionTypes.offline)
                prices.push(item.sessionTypes.offline.price);

              const hasInRange = prices.some(
                (p) => p >= minPrice && p <= maxPrice,
              );
              expect(hasInRange).toBe(true);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('pagination meta is correct when filters are applied', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 20 }), // page
          fc.integer({ min: 1, max: 50 }), // limit
          fc.integer({ min: 0, max: 200 }), // total matching records
          fc.option(
            fc
              .string({ minLength: 1, maxLength: 10 })
              .filter((s) => /^[a-zA-Z]+$/.test(s)),
            {
              nil: undefined,
            },
          ), // optional search filter
          async (page, limit, total, search) => {
            const totalPages = Math.ceil(total / limit);
            const isValidPage = page <= totalPages && total > 0;
            const itemsOnPage = isValidPage
              ? Math.min(limit, total - (page - 1) * limit)
              : 0;

            const counselors = Array.from({ length: itemsOnPage }, (_, i) =>
              createMockCounselor({
                id: `counselor-${i}`,
                fullName: search ? `Dr ${search} Name${i}` : `Counselor ${i}`,
              }),
            );

            repository.findAll.mockResolvedValue({
              counselors,
              total,
            });

            const result = await service.findAll({
              page,
              limit,
              search,
            });

            // Pagination invariants
            expect(result.meta.totalPages).toBe(
              total === 0 ? 0 : Math.ceil(total / limit),
            );
            expect(result.data.length).toBeLessThanOrEqual(limit);
            expect(result.meta.page).toBe(page);

            if (total > 0 && page <= totalPages) {
              expect(result.data.length).toBeGreaterThan(0);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
