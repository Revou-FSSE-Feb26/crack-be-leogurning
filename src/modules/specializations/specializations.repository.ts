import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Specialization } from '@prisma/client';

@Injectable()
export class SpecializationsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Specialization[]> {
    return this.prisma.specialization.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Specialization | null> {
    return this.prisma.specialization.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Specialization | null> {
    return this.prisma.specialization.findUnique({
      where: { name },
    });
  }

  async create(data: {
    name: string;
    description?: string;
    createdBy: string;
    updatedBy: string;
  }): Promise<Specialization> {
    return this.prisma.specialization.create({
      data,
    });
  }

  async update(
    id: string,
    data: { name?: string; description?: string; updatedBy: string },
  ): Promise<Specialization> {
    return this.prisma.specialization.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Specialization> {
    return this.prisma.specialization.delete({
      where: { id },
    });
  }
}
