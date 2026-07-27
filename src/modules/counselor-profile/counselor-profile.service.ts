import { Injectable, NotFoundException } from '@nestjs/common';
import { CounselorProfileRepository } from './counselor-profile.repository';
import { UpdateCounselorProfileDto } from './dto/update-counselor-profile.dto';
import { CounselorProfileResponseDto } from './dto/counselor-profile-response.dto';

@Injectable()
export class CounselorProfileService {
  constructor(
    private readonly counselorProfileRepository: CounselorProfileRepository,
  ) {}

  async getMe(userId: string): Promise<CounselorProfileResponseDto> {
    const profile = await this.counselorProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException('Counselor profile not found');
    }

    return this.formatProfile(profile);
  }

  async updateMe(
    userId: string,
    dto: UpdateCounselorProfileDto,
  ): Promise<{ success: boolean; message: string; data: CounselorProfileResponseDto }> {
    const profile = await this.counselorProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException('Counselor profile not found');
    }

    const updated = await this.counselorProfileRepository.update(profile.id, {
      languages: dto.languages,
      isAvailable: dto.isAvailable,
      availability: dto.availability,
    });

    return {
      success: true,
      message: 'Counselor profile updated successfully',
      data: this.formatProfile(updated),
    };
  }

  private formatProfile(profile: any): CounselorProfileResponseDto {
    return {
      id: profile.id,
      userId: profile.userId,
      licenseNumber: profile.licenseNumber,
      specializations: profile.counselorSpecializations.map(
        (cs: any) => cs.specialization.name,
      ),
      languages: profile.languages,
      isAvailable: profile.isAvailable,
      availability: profile.availability,
      rating: Number(profile.rating),
      reviewCount: profile.reviewCount,
      sessionTypeConfigs: profile.sessionTypeConfigs.map((config: any) => ({
        id: config.id,
        sessionType: config.sessionType,
        name: config.appointmentSessionType.name,
        price: Number(config.appointmentSessionType.price),
        durationMinutes: config.appointmentSessionType.durationMinutes,
        clinicAddress: config.clinicAddress,
      })),
    };
  }
}
