import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SpecializationsRepository } from './specializations.repository';
import { Specialization } from '@prisma/client';

export interface CreateSpecializationInput {
  name: string;
  description?: string;
  userId: string;
}

export interface UpdateSpecializationInput {
  name?: string;
  description?: string;
  userId: string;
}

export interface SpecializationResponseDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class SpecializationsService {
  constructor(
    private readonly specializationsRepository: SpecializationsRepository,
  ) {}

  async findAll(): Promise<SpecializationResponseDto[]> {
    const specializations = await this.specializationsRepository.findAll();
    return specializations.map((s) => this.formatSpecialization(s));
  }

  async create(
    input: CreateSpecializationInput,
  ): Promise<{ success: boolean; message: string; data: SpecializationResponseDto }> {
    const existing = await this.specializationsRepository.findByName(input.name);
    if (existing) {
      throw new ConflictException(
        `Specialization with name "${input.name}" already exists`,
      );
    }

    const specialization = await this.specializationsRepository.create({
      name: input.name,
      description: input.description,
      createdBy: input.userId,
      updatedBy: input.userId,
    });

    return {
      success: true,
      message: 'Specialization created successfully',
      data: this.formatSpecialization(specialization),
    };
  }

  async update(
    id: string,
    input: UpdateSpecializationInput,
  ): Promise<{ success: boolean; message: string; data: SpecializationResponseDto }> {
    const existing = await this.specializationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Specialization not found');
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await this.specializationsRepository.findByName(input.name);
      if (duplicate) {
        throw new ConflictException(
          `Specialization with name "${input.name}" already exists`,
        );
      }
    }

    const updateData: { name?: string; description?: string; updatedBy: string } = {
      updatedBy: input.userId,
    };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    const specialization = await this.specializationsRepository.update(id, updateData);

    return {
      success: true,
      message: 'Specialization updated successfully',
      data: this.formatSpecialization(specialization),
    };
  }

  async delete(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.specializationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Specialization not found');
    }

    await this.specializationsRepository.delete(id);

    return {
      success: true,
      message: 'Specialization deleted successfully',
    };
  }

  private formatSpecialization(s: Specialization): SpecializationResponseDto {
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }
}
