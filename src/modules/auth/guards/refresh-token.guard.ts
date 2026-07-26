import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
// Guard for protecting refresh token endpoints

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}
