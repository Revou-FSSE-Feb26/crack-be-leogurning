import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionTypeDto {
  @ApiProperty({
    description: 'Session type name',
    example: 'Individual Therapy',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Duration in minutes', example: 60, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationMinutes: number;

  @ApiProperty({
    description: 'Price for the session',
    example: 150000,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({ description: 'Tier level', example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  tier: number;

  @ApiProperty({ description: 'Whether session is online', example: true })
  @IsBoolean()
  isOnline: boolean;
}
