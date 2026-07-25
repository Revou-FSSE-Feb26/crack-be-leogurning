import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface CreateUserData {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  role?: string;
}

export interface UserPublicFields {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: Role;
}

export interface UserWithPassword extends UserPublicFields {
  password: string;
}

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      password: user.password,
    };
  }

  async findById(userId: string): Promise<UserPublicFields | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
      },
    });
    return user;
  }

  async createUser(data: CreateUserData): Promise<UserPublicFields> {
    const now = new Date();
    const user = await this.prisma.user.create({
      data: {
        id: uuidv4(),
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role as any,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: '',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
      },
    });
    return user;
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: {
        id: userId,
        refreshToken: { not: null },
      },
      data: { refreshToken: null },
    });
  }
}
