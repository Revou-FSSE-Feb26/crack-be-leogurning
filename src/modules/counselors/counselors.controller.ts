import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RelaxedThrottle } from 'src/common/decorators/custom-throttler.decorator';
import { CounselorsService, CounselorListDto, CounselorDetailDto } from './counselors.service';
import { QueryCounselorsDto } from './dto/query-counselors.dto';

@ApiTags('counselors')
@Controller('counselors')
export class CounselorsController {
  constructor(private readonly counselorsService: CounselorsService) {}

  @Get()
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'Browse counselors',
    description:
      'Get a paginated list of available counselors with optional filters. Public endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Counselors retrieved successfully',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  async findAll(@Query() query: QueryCounselorsDto): Promise<{
    data: CounselorListDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return this.counselorsService.findAll(query);
  }

  @Get(':id')
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'Get counselor detail',
    description:
      'Get detailed counselor information including reviews and schedules. Public endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Counselor detail retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Counselor not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  async findOne(@Param('id') id: string): Promise<CounselorDetailDto> {
    return this.counselorsService.findOne(id);
  }
}
