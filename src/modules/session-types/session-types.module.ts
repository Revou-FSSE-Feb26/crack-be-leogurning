import { Module } from '@nestjs/common';
import { SessionTypesService } from './session-types.service';
import { SessionTypesController } from './session-types.controller';
import { SessionTypesRepository } from './session-types.repository';

@Module({
  providers: [SessionTypesService, SessionTypesRepository],
  controllers: [SessionTypesController],
  exports: [SessionTypesRepository],
})
export class SessionTypesModule {}
