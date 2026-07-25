import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'johndoe@example.com',
    format: 'email',
    description: 'The email of the user',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: '$trongP@ssw0rd!',
    format: 'password',
    description: 'The password of the user',
  })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
