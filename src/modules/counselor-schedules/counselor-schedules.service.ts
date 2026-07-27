import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CounselorSchedulesRepository } from './counselor-schedules.repository';
import { BulkReplaceScheduleDto } from './dto/bulk-replace-schedule.dto';
import { ScheduleSlotDto } from './dto/schedule-slot-response.dto';

@Injectable()
export class CounselorSchedulesService {
  constructor(
    private readonly counselorSchedulesRepository: CounselorSchedulesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findByCounselor(counselorId: string): Promise<{ data: ScheduleSlotDto[] }> {
    const schedules = await this.counselorSchedulesRepository.findByCounselorId(counselorId);
    return { data: schedules.map((s) => this.formatSlot(s)) };
  }

  async bulkReplace(
    counselorId: string,
    userId: string,
    dto: BulkReplaceScheduleDto,
  ): Promise<{ success: boolean; message: string; data: ScheduleSlotDto[] }> {
    // Ownership validation
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { counselorId: true },
    });

    if (user?.counselorId !== counselorId) {
      throw new ForbiddenException('Access denied');
    }

    // Time validation
    for (const slot of dto.slots) {
      if (slot.startTime >= slot.endTime) {
        throw new BadRequestException('startTime must be before endTime');
      }
    }

    // Bulk replace
    const schedules = await this.counselorSchedulesRepository.bulkReplace(
      counselorId,
      dto.slots.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        createdBy: userId,
        updatedBy: userId,
      })),
    );

    return {
      success: true,
      message: 'Schedule updated successfully',
      data: schedules.map((s) => this.formatSlot(s)),
    };
  }

  private formatSlot(schedule: any): ScheduleSlotDto {
    return {
      id: schedule.id,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    };
  }
}
