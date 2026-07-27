import { Module } from '@nestjs/common';
import { CounselorProfileService } from './counselor-profile.service';
import { CounselorProfileController } from './counselor-profile.controller';
import { CounselorProfileRepository } from './counselor-profile.repository';

@Module({
  providers: [CounselorProfileService, CounselorProfileRepository],
  controllers: [CounselorProfileController],
  exports: [CounselorProfileRepository],
})
export class CounselorProfileModule {}
