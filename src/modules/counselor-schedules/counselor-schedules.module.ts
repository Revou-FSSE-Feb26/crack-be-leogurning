import { Module } from '@nestjs/common';
import { CounselorSchedulesService } from './counselor-schedules.service';
import { CounselorSchedulesController } from './counselor-schedules.controller';
import { CounselorSchedulesRepository } from './counselor-schedules.repository';

@Module({
  providers: [CounselorSchedulesService, CounselorSchedulesRepository],
  controllers: [CounselorSchedulesController],
  exports: [CounselorSchedulesRepository],
})
export class CounselorSchedulesModule {}
