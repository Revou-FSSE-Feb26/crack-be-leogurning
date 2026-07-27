import { Injectable, NotFoundException } from '@nestjs/common';
import { CounselorsRepository } from './counselors.repository';
import { QueryCounselorsDto } from './dto/query-counselors.dto';

export interface SessionTypePrice {
  name: string;
  price: number;
  durationMinutes: number;
}

export interface CounselorListDto {
  id: string;
  userId: string;
  fullName: string;
  licenseNumber: string;
  specializations: string[];
  sessionTypes: { online?: SessionTypePrice; offline?: SessionTypePrice };
  availability: string[];
  rating: number;
  reviewCount: number;
  languages: string[];
  isAvailable: boolean;
}

export interface CounselorDetailDto extends CounselorListDto {
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    authorName: string;
    createdAt: string;
  }[];
  schedules: {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
}

@Injectable()
export class CounselorsService {
  constructor(private readonly counselorsRepository: CounselorsRepository) {}

  async findAll(query: QueryCounselorsDto): Promise<{
    data: CounselorListDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page,
      limit,
      search,
      specializationId,
      sessionType,
      language,
      minPrice,
      maxPrice,
    } = query;

    const { counselors, total } = await this.counselorsRepository.findAll({
      page,
      limit,
      search,
      specializationId,
      sessionType,
      language,
      minPrice,
      maxPrice,
    });

    return {
      data: counselors.map((c) => this.formatCounselorList(c)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<CounselorDetailDto> {
    const counselor = await this.counselorsRepository.findById(id);
    if (!counselor) {
      throw new NotFoundException('Counselor not found');
    }
    return this.formatCounselorDetail(counselor);
  }

  private formatCounselorList(counselor: any): CounselorListDto {
    const sessionTypes: {
      online?: SessionTypePrice;
      offline?: SessionTypePrice;
    } = {};

    for (const config of counselor.sessionTypeConfigs) {
      const sessionTypeData: SessionTypePrice = {
        name: config.appointmentSessionType.name,
        price: this.decimalToNumber(config.appointmentSessionType.price),
        durationMinutes: config.appointmentSessionType.durationMinutes,
      };

      if (config.sessionType === 'ONLINE') {
        sessionTypes.online = sessionTypeData;
      } else {
        sessionTypes.offline = sessionTypeData;
      }
    }

    return {
      id: counselor.id,
      userId: counselor.userId,
      fullName: counselor.user?.fullName || '',
      licenseNumber: counselor.licenseNumber,
      specializations: counselor.counselorSpecializations.map(
        (cs: any) => cs.specialization.name,
      ),
      sessionTypes,
      availability: counselor.availability,
      rating: this.decimalToNumber(counselor.rating),
      reviewCount: counselor.reviewCount,
      languages: counselor.languages,
      isAvailable: counselor.isAvailable,
    };
  }

  private formatCounselorDetail(counselor: any): CounselorDetailDto {
    const base = this.formatCounselorList(counselor);

    const reviews = (counselor.appointments || [])
      .filter((a: any) => a.review)
      .map((a: any) => ({
        id: a.review.id,
        rating: a.review.rating,
        comment: a.review.comment,
        authorName: a.client?.fullName || 'Anonymous',
        createdAt: a.review.createdAt.toISOString(),
      }));

    const schedules = (counselor.counselorSchedules || []).map((s: any) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    return {
      ...base,
      reviews,
      schedules,
    };
  }

  private decimalToNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    return Number(value);
  }
}
