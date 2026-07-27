import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import {
  ModerateThrottle,
  RelaxedThrottle,
} from 'src/common/decorators/custom-throttler.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @ModerateThrottle()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a review',
    description: 'Client creates a review for a completed appointment',
  })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Appointment not completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 409, description: 'Review already exists' })
  async create(
    @GetUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<{ success: boolean; message: string; data: ReviewResponseDto }> {
    return this.reviewsService.create(userId, dto);
  }

  @Get('counselor/:counselorId')
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'Get counselor reviews',
    description: 'Get all reviews for a specific counselor (public)',
  })
  @ApiResponse({ status: 200, description: 'List of counselor reviews' })
  async findByCounselor(
    @Param('counselorId') counselorId: string,
  ): Promise<{ data: ReviewResponseDto[] }> {
    return this.reviewsService.findByCounselor(counselorId);
  }
}
