// DTO for auth response

import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token for authentication',
    example:
      'a2e2178dfa115fe035b3516adc9147d883ee29ca2cbae67dfe77ce83e6200081a41a2fb1dcaa53d3342920df6180eb9a545db75029fa5958df90886152e67714',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token for generating new access tokens',
    example:
      'a2e2178dfa115fe035b3516adc9147d883ee29ca2cbae67dfe77ce83e6200081a41a2fb1dcaa53d3342920df6180eb9a545db75029fa5958df90886152e67714',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Authenticated User information',
    example: {
      id: 'clm7400000000000000000001',
      email: 'user@example.com',
      fullName: 'Andi Pratama',
      role: 'CLIENT',
    },
  })
  user: {
    id: string;
    email: string;
    fullName: string | null;
    role: Role;
  };
}
