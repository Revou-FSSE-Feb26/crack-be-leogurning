import { Injectable } from '@nestjs/common';
import { appointments as seedData } from '../../../prisma/data/appointments.js';
import { v4 as uuidv4 } from 'uuid';

export interface AppointmentEntity {
  id: string;
  clientId: string;
  counselorId: string;
  sessionType: string;
  date: Date;
  time: string;
  endTime: string;
  durationMinutes: number;
  rate: number;
  status: string;
  meetingLink: string | null;
  notes: string | null;
  referenceCode: string | null;
  cancellationNotes: string | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

@Injectable()
export class AppointmentsRepository {
  private data: AppointmentEntity[] = [...seedData] as AppointmentEntity[];

  findAll(): AppointmentEntity[] {
    return this.data;
  }

  findById(id: string): AppointmentEntity | undefined {
    return this.data.find((item) => item.id === id);
  }

  findByClientId(clientId: string): AppointmentEntity[] {
    return this.data.filter((item) => item.clientId === clientId);
  }

  findByCounselorId(counselorId: string): AppointmentEntity[] {
    return this.data.filter((item) => item.counselorId === counselorId);
  }

  create(
    data: Omit<AppointmentEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): AppointmentEntity {
    const now = new Date();
    const entity: AppointmentEntity = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.data.push(entity);
    return entity;
  }

  update(
    id: string,
    data: Partial<AppointmentEntity>,
  ): AppointmentEntity | undefined {
    const index = this.data.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    this.data[index] = {
      ...this.data[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.data[index];
  }

  delete(id: string): boolean {
    const index = this.data.findIndex((item) => item.id === id);
    if (index === -1) return false;
    this.data.splice(index, 1);
    return true;
  }
}
