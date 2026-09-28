import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Joi from 'joi';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { dataSourceOptions } from './data-source.js';
import { TasksModule } from './tasks/tasks.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { UsersModule } from './users/users.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AccountThrottlerGuard } from './auth/guards/account-throttler.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
        CORS_ORIGIN: Joi.string().required(),
        THROTTLE_DEFAULT_LIMIT: Joi.number().default(100),
        THROTTLE_REGISTER_LIMIT: Joi.number().default(5),
        THROTTLE_REFRESH_LIMIT: Joi.number().default(10),
      }),
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    TasksModule,
    ProjectsModule,
    UsersModule,
    CommentsModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: 60000,
          limit: config.get<number>('THROTTLE_DEFAULT_LIMIT', 100),
        },
        {
          name: 'register',
          ttl: 60000,
          limit: config.get<number>('THROTTLE_REGISTER_LIMIT', 5),
        },
        {
          name: 'login',
          ttl: 60000,
          limit: 5, // intentionally NOT config-driven — throttle.e2e-spec.ts tests this exact real limit
        },
        {
          name: 'refresh',
          ttl: 60000,
          limit: config.get<number>('THROTTLE_REFRESH_LIMIT', 10),
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AccountThrottlerGuard },
  ],
})
export class AppModule {}
