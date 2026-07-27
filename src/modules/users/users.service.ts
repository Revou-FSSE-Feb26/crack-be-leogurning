import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(query: QueryUsersDto): Promise<{
    data: UserResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page, limit, search, role } = query;

    const { users, total } = await this.usersRepository.findAll({
      page,
      limit,
      search,
      role,
    });

    return {
      data: users.map((user) => this.formatUser(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.formatUser(user);
  }

  async updateMe(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<{ success: boolean; message: string; data: UserResponseDto }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.dateOfBirth !== undefined)
      updateData.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.emergencyContact !== undefined)
      updateData.emergencyContact = dto.emergencyContact;

    const updatedUser = await this.usersRepository.update(userId, updateData);

    return {
      success: true,
      message: 'Profile updated successfully',
      data: this.formatUser(updatedUser),
    };
  }

  async toggleActive(
    id: string,
  ): Promise<{ success: boolean; message: string; data: UserResponseDto }> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.usersRepository.toggleActive(
      id,
      user.isActive,
    );

    return {
      success: true,
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      data: this.formatUser(updatedUser),
    };
  }

  private formatUser(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
      emergencyContact: user.emergencyContact,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isActive: user.isActive,
      counselorId: user.counselorId,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
