import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SessionType } from '@prisma/client';

export class QueryCounselorsDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    example: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Search by counselor full name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by specialization ID',
    example: 'uuid-specialization-id',
  })
  @IsString()
  @IsOptional()
  specializationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by session type',
    enum: SessionType,
    example: 'ONLINE',
  })
  @IsEnum(SessionType)
  @IsOptional()
  sessionType?: SessionType;

  @ApiPropertyOptional({
    description: 'Filter by language',
    example: 'English',
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({
    description: 'Minimum price filter',
    example: 100000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price filter',
    example: 500000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;
}
