import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
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
  RelaxedThrottle,
  ModerateThrottle,
} from 'src/common/decorators/custom-throttler.decorator';
import { CounselorProfileService } from './counselor-profile.service';
import { UpdateCounselorProfileDto } from './dto/update-counselor-profile.dto';
import { CounselorProfileResponseDto } from './dto/counselor-profile-response.dto';

@ApiTags('counselor-profile')
@Controller('counselor-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COUNSELOR)
@ApiBearerAuth('JWT-auth')
export class CounselorProfileController {
  constructor(
    private readonly counselorProfileService: CounselorProfileService,
  ) {}

  @Get('me')
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'Get own counselor profile',
    description:
      'Retrieve the authenticated counselor\'s own profile including specializations and session configs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Counselor profile retrieved successfully',
    type: CounselorProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not a counselor' })
  @ApiResponse({ status: 404, description: 'Counselor profile not found' })
  async getMe(
    @GetUser('id') userId: string,
  ): Promise<CounselorProfileResponseDto> {
    return this.counselorProfileService.getMe(userId);
  }

  @Patch('me')
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Update own counselor profile',
    description:
      'Update the authenticated counselor\'s profile fields (languages, isAvailable, availability).',
  })
  @ApiResponse({
    status: 200,
    description: 'Counselor profile updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not a counselor' })
  @ApiResponse({ status: 404, description: 'Counselor profile not found' })
  async updateMe(
    @GetUser('id') userId: string,
    @Body() dto: UpdateCounselorProfileDto,
  ): Promise<{ success: boolean; message: string; data: CounselorProfileResponseDto }> {
    return this.counselorProfileService.updateMe(userId, dto);
  }
}
