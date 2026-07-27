import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionTypesRepository } from './session-types.repository';
import { AppointmentSessionType } from '@prisma/client';

export interface CreateSessionTypeInput {
  name: string;
  durationMinutes: number;
  price: number;
  tier: number;
  isOnline: boolean;
  userId: string;
}

export interface UpdateSessionTypeInput {
  name?: string;
  durationMinutes?: number;
  price?: number;
  tier?: number;
  isOnline?: boolean;
  userId: string;
}

export interface SessionTypeResponseDto {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  tier: number;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class SessionTypesService {
  constructor(
    private readonly sessionTypesRepository: SessionTypesRepository,
  ) {}

  async findAll(): Promise<SessionTypeResponseDto[]> {
    const sessionTypes = await this.sessionTypesRepository.findAll();
    return sessionTypes.map((s) => this.formatSessionType(s));
  }

  async create(
    input: CreateSessionTypeInput,
  ): Promise<{ success: boolean; message: string; data: SessionTypeResponseDto }> {
    const sessionType = await this.sessionTypesRepository.create({
      name: input.name,
      durationMinutes: input.durationMinutes,
      price: input.price,
      tier: input.tier,
      isOnline: input.isOnline,
      createdBy: input.userId,
      updatedBy: input.userId,
    });

    return {
      success: true,
      message: 'Session type created successfully',
      data: this.formatSessionType(sessionType),
    };
  }

  async update(
    id: string,
    input: UpdateSessionTypeInput,
  ): Promise<{ success: boolean; message: string; data: SessionTypeResponseDto }> {
    const existing = await this.sessionTypesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Session type not found');
    }

    const updateData: {
      name?: string;
      durationMinutes?: number;
      price?: number;
      tier?: number;
      isOnline?: boolean;
      updatedBy: string;
    } = {
      updatedBy: input.userId,
    };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.durationMinutes !== undefined) updateData.durationMinutes = input.durationMinutes;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.tier !== undefined) updateData.tier = input.tier;
    if (input.isOnline !== undefined) updateData.isOnline = input.isOnline;

    const sessionType = await this.sessionTypesRepository.update(id, updateData);

    return {
      success: true,
      message: 'Session type updated successfully',
      data: this.formatSessionType(sessionType),
    };
  }

  async delete(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.sessionTypesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Session type not found');
    }

    await this.sessionTypesRepository.delete(id);

    return {
      success: true,
      message: 'Session type deleted successfully',
    };
  }

  private formatSessionType(s: AppointmentSessionType): SessionTypeResponseDto {
    return {
      id: s.id,
      name: s.name,
      durationMinutes: s.durationMinutes,
      price: Number(s.price),
      tier: s.tier,
      isOnline: s.isOnline,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }
}
