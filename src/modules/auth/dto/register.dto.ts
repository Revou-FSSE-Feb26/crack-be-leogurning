import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  Matches,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
} from 'class-validator';
// Data Transfer Object (DTO) for user registration

export class RegisterDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'johndoe@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: '$trongP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number, and one special character',
  })
  password: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+62 812 3456 789',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Role of the user',
    example: 'CLIENT',
  })
  @IsString()
  @IsNotEmpty({ message: 'Role is required' })
  role: string;
}
