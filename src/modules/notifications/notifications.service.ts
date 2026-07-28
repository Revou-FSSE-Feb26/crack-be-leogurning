import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async findAll(
    userId: string,
    query: QueryNotificationsDto,
  ): Promise<{
    data: NotificationResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page, limit } = query;
    const { notifications, total } =
      await this.notificationsRepository.findAll({ userId, page, limit });

    return {
      data: notifications.map((n) => this.formatNotification(n)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markRead(
    userId: string,
    id: string,
  ): Promise<{ success: boolean; message: string; data: null }> {
    const notification = await this.notificationsRepository.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.notificationsRepository.markRead(id);

    return {
      success: true,
      message: 'Notification marked as read',
      data: null,
    };
  }

  async markAllRead(
    userId: string,
  ): Promise<{ success: boolean; message: string; data: null }> {
    await this.notificationsRepository.markAllRead(userId);

    return {
      success: true,
      message: 'All notifications marked as read',
      data: null,
    };
  }

  private formatNotification(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
