import { ExecutionContext, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { env } from './config/env.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { dataSourceOptions } from './data-source.js';
import { TasksModule } from './tasks/tasks.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { UsersModule } from './users/users.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AccountThrottlerGuard } from './auth/guards/account-throttler.guard.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { HealthModule } from './health/health.module.js';
import { ShutdownLoggerService } from './common/shutdown-logger.service.js';

const onlyOn = (path: string) => (ctx: ExecutionContext) =>
  ctx.switchToHttp().getRequest().url.split('?')[0] !== path;

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    TasksModule,
    ProjectsModule,
    UsersModule,
    CommentsModule,
    HealthModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: env.throttleDefaultLimit,
      },
      {
        name: 'register',
        ttl: 60000,
        limit: env.throttleRegisterLimit,
        skipIf: onlyOn('/auth/register'),
      },
      {
        name: 'login',
        ttl: 60000,
        limit: 5, // intentionally NOT config-driven — throttle.e2e-spec.ts tests this exact real limit
        skipIf: onlyOn('/auth/login'),
      },
      {
        name: 'refresh',
        ttl: 60000,
        limit: env.throttleRefreshLimit,
        skipIf: onlyOn('/auth/refresh'),
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ShutdownLoggerService,
    { provide: APP_GUARD, useClass: AccountThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
