import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentProofStatus, AppointmentStatus } from '@prisma/client';
import { PaymentProofsRepository } from './payment-proofs.repository';
import { AppointmentsRepository } from 'src/modules/appointments/appointments.repository';
import { CreatePaymentProofDto } from './dto/create-payment-proof.dto';
import { RejectPaymentProofDto } from './dto/reject-payment-proof.dto';
import { PaymentProofResponseDto } from './dto/payment-proof-response.dto';

@Injectable()
export class PaymentProofsService {
  constructor(
    private readonly paymentProofsRepository: PaymentProofsRepository,
    private readonly appointmentsRepository: AppointmentsRepository,
  ) {}

  async create(
    userId: string,
    dto: CreatePaymentProofDto,
    file: Express.Multer.File,
  ): Promise<{ success: boolean; message: string; data: PaymentProofResponseDto }> {
    // Check no existing proof for this appointment
    const existing = await this.paymentProofsRepository.findByAppointmentId(
      dto.appointmentId,
    );
    if (existing) {
      throw new ConflictException(
        'Payment proof already exists for this appointment',
      );
    }

    // Create payment proof record
    const proof = await this.paymentProofsRepository.create({
      appointmentId: dto.appointmentId,
      filename: file.filename,
      submittedAt: new Date(),
      createdBy: userId,
      updatedBy: userId,
    });

    // Update appointment status to PAYMENT_UPLOADED
    await this.appointmentsRepository.update(dto.appointmentId, {
      status: AppointmentStatus.PAYMENT_UPLOADED,
    } as any);

    return {
      success: true,
      message: 'Payment proof uploaded successfully',
      data: this.formatPaymentProof(proof),
    };
  }

  async verify(
    id: string,
  ): Promise<{ success: boolean; message: string; data: PaymentProofResponseDto }> {
    const proof = await this.paymentProofsRepository.findById(id);
    if (!proof) {
      throw new NotFoundException('Payment proof not found');
    }

    // Update proof status to VERIFIED
    const updated = await this.paymentProofsRepository.updateStatus(id, {
      status: PaymentProofStatus.VERIFIED,
    });

    // Update appointment status to PAYMENT_VERIFIED
    await this.appointmentsRepository.update(proof.appointmentId, {
      status: AppointmentStatus.PAYMENT_VERIFIED,
    } as any);

    return {
      success: true,
      message: 'Payment proof verified successfully',
      data: this.formatPaymentProof(updated),
    };
  }

  async reject(
    id: string,
    dto: RejectPaymentProofDto,
  ): Promise<{ success: boolean; message: string; data: PaymentProofResponseDto }> {
    const proof = await this.paymentProofsRepository.findById(id);
    if (!proof) {
      throw new NotFoundException('Payment proof not found');
    }

    // Update proof status to REJECTED with reason
    const updated = await this.paymentProofsRepository.updateStatus(id, {
      status: PaymentProofStatus.REJECTED,
      rejectionReason: dto.rejectionReason,
    });

    // Update appointment status back to AWAITING_PAYMENT
    await this.appointmentsRepository.update(proof.appointmentId, {
      status: AppointmentStatus.AWAITING_PAYMENT,
    } as any);

    return {
      success: true,
      message: 'Payment proof rejected',
      data: this.formatPaymentProof(updated),
    };
  }

  private formatPaymentProof(proof: any): PaymentProofResponseDto {
    return {
      id: proof.id,
      appointmentId: proof.appointmentId,
      filename: proof.filename,
      submittedAt: proof.submittedAt,
      status: proof.status,
      rejectionReason: proof.rejectionReason ?? null,
      createdAt: proof.createdAt,
      updatedAt: proof.updatedAt,
    };
  }
}
