import { Injectable } from '@nestjs/common';
import { DayOfWeek } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CounselorSchedulesRepository {
  constructor(private prisma: PrismaService) {}

  async findByCounselorId(counselorId: string) {
    return this.prisma.counselorSchedule.findMany({
      where: { counselorId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async bulkReplace(
    counselorId: string,
    slots: {
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      createdBy: string;
      updatedBy: string;
    }[],
  ) {
    await this.prisma.$transaction([
      this.prisma.counselorSchedule.deleteMany({
        where: { counselorId },
      }),
      this.prisma.counselorSchedule.createMany({
        data: slots.map((s) => ({ ...s, counselorId })),
      }),
    ]);

    return this.findByCounselorId(counselorId);
  }
}
