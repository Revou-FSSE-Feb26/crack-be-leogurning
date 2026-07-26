import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Register api
  @Post('register')
  @HttpCode(201)
  @ApiOperation({
    summary: 'New User registration',
    operationId: 'register',
    description: 'Register a new user with email, username and password',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Validation failed or user already exists',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return await this.authService.register(registerDto);
  }

  // Refresh access token
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth('JWT-refresh')
  @ApiOperation({
    summary: 'Refresh Access Token',
    operationId: 'refresh',
    description: 'Generate a new access token using a valid refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Invalid or expired refresh token.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  async refresh(@GetUser('id') userId: string): Promise<AuthResponseDto> {
    return await this.authService.refreshTokens(userId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout',
    operationId: 'logout',
    description: 'Logout a user and invalidating the refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Invalid or missing token.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async logout(@GetUser('id') userId: string): Promise<{ message: string }> {
    await this.authService.logout(userId);
    return { message: 'Successfully logged out' };
  }

  // Login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User Login',
    operationId: 'login',
    description:
      'Authenticate user with email and password and return access and refresh tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid email or password.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Account is disabled or email not verified.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return await this.authService.login(loginDto);
  }
}
