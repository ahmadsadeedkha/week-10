import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../entities/User.js';
import { RefreshToken } from '../entities/RefreshToken.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy.js';
import { RolesGuard } from './guards/roles.guard.js';
import { ProjectMember } from '../entities/ProjectMember.js';
import { Task } from '../entities/Task.js';
import { env } from '../config/env.js';
import type { StringValue } from 'ms';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, ProjectMember, Task]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: env.jwtSecret,
      signOptions: {
        expiresIn: env.jwtAccessExpiresIn as StringValue,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [PassportModule, JwtStrategy, RolesGuard],
})
export class AuthModule {}
