import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role, User } from '@prisma/client';

export interface FindAllUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
}

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(
    params: FindAllUsersParams,
  ): Promise<{ users: User[]; total: number }> {
    const { page, limit, search, role } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.fullName = { contains: search, mode: 'insensitive' };
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async toggleActive(id: string, currentIsActive: boolean): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !currentIsActive },
    });
  }
}
