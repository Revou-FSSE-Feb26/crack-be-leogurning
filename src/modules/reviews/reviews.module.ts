import { Module } from '@nestjs/common';
import { AppointmentsModule } from 'src/modules/appointments/appointments.module';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsRepository } from './reviews.repository';

@Module({
  imports: [AppointmentsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRepository],
  exports: [ReviewsRepository],
})
export class ReviewsModule {}
