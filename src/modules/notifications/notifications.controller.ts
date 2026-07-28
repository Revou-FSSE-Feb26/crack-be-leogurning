import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import {
  ModerateThrottle,
  RelaxedThrottle,
} from 'src/common/decorators/custom-throttler.decorator';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'List notifications',
    description: 'Get paginated list of notifications for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of notifications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @GetUser('id') userId: string,
    @Query() query: QueryNotificationsDto,
  ): Promise<{
    data: NotificationResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return this.notificationsService.findAll(userId, query);
  }

  @Patch('read-all')
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all unread notifications as read for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllRead(
    @GetUser('id') userId: string,
  ): Promise<{ success: boolean; message: string; data: null }> {
    return this.notificationsService.markAllRead(userId);
  }

  @Patch(':id/read')
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a single notification as read (must be owned by user)',
  })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markRead(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; data: null }> {
    return this.notificationsService.markRead(userId, id);
  }
}
