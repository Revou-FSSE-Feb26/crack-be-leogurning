import { Module } from '@nestjs/common';
import { SpecializationsService } from './specializations.service';
import { SpecializationsController } from './specializations.controller';
import { SpecializationsRepository } from './specializations.repository';

@Module({
  providers: [SpecializationsService, SpecializationsRepository],
  controllers: [SpecializationsController],
  exports: [SpecializationsRepository],
})
export class SpecializationsModule {}
