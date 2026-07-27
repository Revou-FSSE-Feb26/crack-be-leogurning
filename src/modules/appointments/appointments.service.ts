import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AppointmentsRepository } from './appointments.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppointmentStatus, SessionType, Role } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { ConfirmAppointmentDto } from './dto/confirm-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { ConfirmRescheduleDto } from './dto/confirm-reschedule.dto';
import { RejectRescheduleDto } from './dto/reject-reschedule.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { AppointmentDetailDto } from './dto/appointment-detail.dto';

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, dto: CreateAppointmentDto) {
    const status: AppointmentStatus =
      dto.sessionType === SessionType.ONLINE
        ? AppointmentStatus.AWAITING_PAYMENT
        : AppointmentStatus.PENDING;

    const entity = await this.appointmentsRepository.create({
      clientId: userId,
      counselorId: dto.counselorId,
      sessionType: dto.sessionType,
      date: new Date(dto.date),
      time: dto.time,
      endTime: dto.endTime,
      durationMinutes: dto.durationMinutes,
      rate: dto.rate,
      status,
      notes: dto.notes,
      referenceCode: dto.referenceCode,
      createdBy: userId,
      updatedBy: userId,
    });

    return {
      success: true,
      message: 'Appointment created successfully',
      data: this.formatAppointment(entity),
    };
  }

  async findAll(user: JwtPayload, query: QueryAppointmentsDto) {
    let counselorProfileId: string | undefined;

    if (user.role === Role.COUNSELOR) {
      counselorProfileId = await this.getCounselorProfileId(user.id);
    }

    const { appointments, total } = await this.appointmentsRepository.findAll({
      page: query.page,
      limit: query.limit,
      status: query.status,
      sessionType: query.sessionType,
      search: query.search,
      userId: user.id,
      userRole: user.role,
      counselorProfileId,
    });

    return {
      data: appointments.map((a) => this.formatAppointment(a)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(user: JwtPayload, id: string): Promise<AppointmentDetailDto> {
    const entity = await this.appointmentsRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }

    // Verify ownership
    if (user.role === Role.CLIENT) {
      if (entity.clientId !== user.id) {
        throw new ForbiddenException('Access denied');
      }
    } else if (user.role === Role.COUNSELOR) {
      await this.verifyCounselorOwnership(user.id, entity);
    }
    // ADMIN can view all

    const base = this.formatAppointment(entity);

    const detail: AppointmentDetailDto = {
      ...base,
      paymentProof: entity.paymentProof
        ? {
            id: entity.paymentProof.id,
            filename: entity.paymentProof.filename,
            status: entity.paymentProof.status,
            submittedAt: entity.paymentProof.createdAt.toISOString(),
            rejectionReason: entity.paymentProof.rejectionReason ?? null,
          }
        : null,
      review: entity.review
        ? {
            id: entity.review.id,
            rating: entity.review.rating,
            comment: entity.review.comment ?? null,
            createdAt: entity.review.createdAt.toISOString(),
          }
        : null,
    };

    return detail;
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const existing = await this.appointmentsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }

    const updateData: any = {};
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.meetingLink !== undefined) updateData.meetingLink = dto.meetingLink;

    const updated = await this.appointmentsRepository.update(id, updateData);
    return {
      success: true,
      message: 'Appointment updated successfully',
      data: this.formatAppointment(updated),
    };
  }

  async confirm(userId: string, id: string, dto: ConfirmAppointmentDto) {
    const entity = await this.appointmentsRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }

    await this.verifyCounselorOwnership(userId, entity);

    const updateData: any = {
      status: AppointmentStatus.CONFIRMED,
      updatedBy: userId,
    };
    if (dto.meetingLink) {
      updateData.meetingLink = dto.meetingLink;
    }

    const updated = await this.appointmentsRepository.update(id, updateData);
    return {
      success: true,
      message: 'Appointment confirmed successfully',
      data: this.formatAppointment(updated),
    };
  }

  async cancel(id: string, dto: CancelAppointmentDto) {
    const entity = await this.appointmentsRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }

    const updated = await this.appointmentsRepository.update(id, {
      status: AppointmentStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationNotes: dto.cancellationNotes,
      cancelledBy: dto.cancelledBy,
    });

    return {
      success: true,
      message: 'Appointment cancelled successfully',
      data: this.formatAppointment(updated),
    };
  }

  async reschedule(userId: string, id: string, dto: RescheduleAppointmentDto) {
    const entity = await this.appointmentsRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }

    // Verify CLIENT ownership
    if (entity.clientId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.appointmentsRepository.update(id, {
      status: AppointmentStatus.PENDING_RESCHEDULE,
      date: new Date(dto.date),
      time: dto.time,
      endTime: dto.endTime,
      updatedBy: userId,
    });

    return {
      success: true,
      message: 'Reschedule request submitted successfully',
      data: this.formatAppointment(updated),
    };
  }

  async start(userId: string, id: string) {
    const entity = await this.appointmentsRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }

    await this.verifyCounselorOwnership(userId, entity);

    const updated = await this.appointmentsRepository.update(id, {
      status: AppointmentStatus.IN_PROGRESS,
      updatedBy: userId,
    });

    return {
      success: true,
      message: 'Appointment started successfully',
      data: this.formatAppointment(updated),
    };
  }

  async complete(userId: string, id: string) {
    const entity = await this.appointmentsRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }

    await this.verifyCounselorOwnership(userId, entity);

    const updated = await this.appointmentsRepository.update(id, {
      status: AppointmentStatus.COMPLETED,
      updatedBy: userId,
    });

    return {
      success: true,
      message: 'Appointment completed successfully',
      data: this.formatAppointment(updated),
    };
  }

  async confirmReschedule(
    userId: string,
    id: string,
    dto: ConfirmRescheduleDto,
  ) {
    const entity = await this.appointmentsRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }

    await this.verifyCounselorOwnership(userId, entity);

    const updateData: any = {
      status: AppointmentStatus.CONFIRMED,
      updatedBy: userId,
    };
    if (dto.meetingLink) {
      updateData.meetingLink = dto.meetingLink;
    }

    const updated = await this.appointmentsRepository.update(id, updateData);
    return {
      success: true,
      message: 'Reschedule confirmed successfully',
      data: this.formatAppointment(updated),
    };
  }

  async rejectReschedule(userId: string, id: string, dto: RejectRescheduleDto) {
    const entity = await this.appointmentsRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }

    await this.verifyCounselorOwnership(userId, entity);

    const existingNotes = entity.notes ?? '';
    const updatedNotes = existingNotes
      ? `${existingNotes}\n[Reschedule Rejected]: ${dto.reason}`
      : `[Reschedule Rejected]: ${dto.reason}`;

    const updated = await this.appointmentsRepository.update(id, {
      status: AppointmentStatus.REJECTED_SCHEDULE,
      notes: updatedNotes,
      updatedBy: userId,
    });

    return {
      success: true,
      message: 'Reschedule rejected successfully',
      data: this.formatAppointment(updated),
    };
  }

  async remove(id: string) {
    const existing = await this.appointmentsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }

    await this.appointmentsRepository.delete(id);

    return {
      success: true,
      message: 'Appointment deleted successfully',
      data: null,
    };
  }

  // --- Private helpers ---

  private formatAppointment(entity: any): AppointmentResponseDto {
    return {
      id: entity.id,
      clientId: entity.clientId,
      counselorId: entity.counselorId,
      sessionType: entity.sessionType,
      date:
        entity.date instanceof Date
          ? entity.date.toISOString()
          : String(entity.date),
      time: entity.time,
      endTime: entity.endTime,
      durationMinutes: entity.durationMinutes,
      rate: entity.rate ? Number(entity.rate) : 0,
      status: entity.status,
      meetingLink: entity.meetingLink ?? null,
      notes: entity.notes ?? null,
      referenceCode: entity.referenceCode ?? null,
      cancellationNotes: entity.cancellationNotes ?? null,
      cancelledAt: entity.cancelledAt ? entity.cancelledAt.toISOString() : null,
      cancelledBy: entity.cancelledBy ?? null,
      clientName: entity.client?.fullName ?? null,
      counselorName: entity.counselor?.user?.fullName ?? null,
      createdAt:
        entity.createdAt instanceof Date
          ? entity.createdAt.toISOString()
          : String(entity.createdAt),
      updatedAt:
        entity.updatedAt instanceof Date
          ? entity.updatedAt.toISOString()
          : String(entity.updatedAt),
    };
  }

  private async getCounselorProfileId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { counselorId: true },
    });

    if (!user?.counselorId) {
      throw new ForbiddenException(
        'User does not have an associated counselor profile',
      );
    }

    return user.counselorId;
  }

  private async verifyCounselorOwnership(
    userId: string,
    appointment: any,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { counselorId: true },
    });

    if (user?.counselorId !== appointment.counselorId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
