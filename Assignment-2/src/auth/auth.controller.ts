import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService, TokenPair } from './auth.service.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ register: {} })
  @SkipThrottle({ default: true, login: true, refresh: true })
  async register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: {} })
  @SkipThrottle({ default: true, register: true, refresh: true })
  async login(@Body() dto: LoginDto): Promise<TokenPair> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ refresh: {} })
  @SkipThrottle({ default: true, register: true, login: true })
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenPair> {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle({ default: true, register: true, login: true })
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    return this.authService.logout(dto.refresh_token);
  }
}
