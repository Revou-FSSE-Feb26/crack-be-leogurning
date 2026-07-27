import { Module } from '@nestjs/common';
import { CounselorsService } from './counselors.service';
import { CounselorsController } from './counselors.controller';
import { CounselorsRepository } from './counselors.repository';

@Module({
  providers: [CounselorsService, CounselorsRepository],
  controllers: [CounselorsController],
  exports: [CounselorsRepository],
})
export class CounselorsModule {}
