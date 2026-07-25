import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AppointmentsRepository,
  AppointmentEntity,
} from './appointments.repository.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
  ) {}

  create(createDto: CreateAppointmentDto) {
    const entity = this.appointmentsRepository.create({
      clientId: createDto.clientId,
      counselorId: createDto.counselorId,
      sessionType: createDto.sessionType,
      date: new Date(createDto.date),
      time: createDto.time,
      endTime: createDto.endTime,
      durationMinutes: createDto.durationMinutes,
      rate: createDto.rate,
      status: 'PENDING',
      meetingLink: null,
      notes: createDto.notes ?? null,
      referenceCode: createDto.referenceCode ?? null,
      cancellationNotes: null,
      cancelledAt: null,
      cancelledBy: null,
      createdBy: createDto.clientId,
      updatedBy: createDto.clientId,
    });
    return {
      success: true,
      message: 'Appointment created successfully',
      data: this.formatResponse(entity),
    };
  }

  findAll() {
    const entities = this.appointmentsRepository.findAll();
    return {
      data: entities.map((e) => this.formatResponse(e)),
      meta: { total: entities.length },
    };
  }

  findOne(id: string) {
    const entity = this.appointmentsRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }
    return this.formatResponse(entity);
  }

  update(id: string, updateDto: UpdateAppointmentDto) {
    const existing = this.appointmentsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }
    const updateData: any = { ...updateDto, updatedBy: 'system' };
    if (updateDto.date) updateData.date = new Date(updateDto.date);
    if (updateDto.status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }
    const updated = this.appointmentsRepository.update(id, updateData);
    return {
      success: true,
      message: 'Appointment updated successfully',
      data: this.formatResponse(updated!),
    };
  }

  remove(id: string) {
    const existing = this.appointmentsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }
    this.appointmentsRepository.delete(id);
    return {
      success: true,
      message: `Appointment with ID "${id}" deleted successfully`,
    };
  }

  private formatResponse(entity: AppointmentEntity) {
    return {
      id: entity.id,
      clientId: entity.clientId,
      counselorId: entity.counselorId,
      sessionType: entity.sessionType,
      date: entity.date,
      time: entity.time,
      endTime: entity.endTime,
      durationMinutes: entity.durationMinutes,
      rate: entity.rate,
      status: entity.status,
      meetingLink: entity.meetingLink,
      notes: entity.notes,
      referenceCode: entity.referenceCode,
      cancellationNotes: entity.cancellationNotes,
      cancelledAt: entity.cancelledAt,
      cancelledBy: entity.cancelledBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
