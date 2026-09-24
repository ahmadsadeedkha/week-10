import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { User } from '../entities/User.js';
import { RefreshToken } from '../entities/RefreshToken.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const password_hash = await argon2.hash(dto.password);

    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password_hash,
    });
    const saved = await this.userRepository.save(user);

    return new UserResponseDto({
      id: saved.id,
      name: saved.name,
      email: saved.email,
      created_at: saved.created_at,
    });
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const passwordValid = await argon2.verify(user.password_hash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokenPair(user);
  }

  private async issueTokenPair(user: User): Promise<TokenPair> {
    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });
    const rawSecret = crypto.randomBytes(64).toString('hex');
    const token_hash = await argon2.hash(rawSecret);

    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN')!;
    const expires_at = new Date(Date.now() + this.parseDuration(expiresIn));

    const refreshTokenEntity = this.refreshTokenRepository.create({
      user_id: user.id,
      token_hash,
      expires_at,
    });
    const saved = await this.refreshTokenRepository.save(refreshTokenEntity);

    const refresh_token = `${saved.id}.${rawSecret}`;

    return { access_token, refresh_token };
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid duration format: ${duration}`);
    const [, value, unit] = match;
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return Number(value) * multipliers[unit];
  }

  async refresh(rawToken: string) {
    const tokenRow = await this.findAndValidateToken(rawToken);

    return this.dataSource.transaction(async (manager) => {
      await manager.update(RefreshToken, tokenRow.id, {
        revoked_at: new Date(),
      });

      const access_token = await this.jwtService.signAsync({
        sub: tokenRow.user.id,
        email: tokenRow.user.email,
      });

      const rawSecret = crypto.randomBytes(64).toString('hex');
      const token_hash = await argon2.hash(rawSecret);

      const expiresIn = this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
      )!;
      const expires_at = new Date(Date.now() + this.parseDuration(expiresIn));

      const newTokenEntity = manager.create(RefreshToken, {
        user_id: tokenRow.user.id,
        token_hash,
        expires_at,
      });
      const saved = await manager.save(newTokenEntity);

      const refresh_token = `${saved.id}.${rawSecret}`;

      return { access_token, refresh_token };
    });
  }

  async logout(rawToken: string): Promise<void> {
    const tokenRow = await this.findAndValidateToken(rawToken);

    await this.refreshTokenRepository.update(tokenRow.id, {
      revoked_at: new Date(),
    });
  }

  private async findAndValidateToken(rawToken: string): Promise<RefreshToken> {
    const [idPart, secretPart] = rawToken.split('.');
    const tokenId = Number(idPart);

    if (!tokenId || !secretPart) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenRow = await this.refreshTokenRepository.findOne({
      where: { id: tokenId },
      relations: { user: true },
    });
    if (!tokenRow) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const secretValid = await argon2.verify(tokenRow.token_hash, secretPart);
    if (!secretValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRow.revoked_at) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRow.expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return tokenRow;
  }
}
