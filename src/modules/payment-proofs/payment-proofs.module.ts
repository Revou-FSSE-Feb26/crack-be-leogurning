import { Module } from '@nestjs/common';
import { AppointmentsModule } from 'src/modules/appointments/appointments.module';
import { PaymentProofsService } from './payment-proofs.service';
import { PaymentProofsController } from './payment-proofs.controller';
import { PaymentProofsRepository } from './payment-proofs.repository';

@Module({
  imports: [AppointmentsModule],
  controllers: [PaymentProofsController],
  providers: [PaymentProofsService, PaymentProofsRepository],
  exports: [PaymentProofsRepository],
})
export class PaymentProofsModule {}
