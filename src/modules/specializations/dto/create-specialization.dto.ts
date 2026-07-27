import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSpecializationDto {
  @ApiProperty({
    description: 'Name of the specialization',
    example: 'Cognitive Behavioral Therapy',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the specialization',
    example:
      'A type of psychotherapy that helps patients manage problems by changing the way they think and behave.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
