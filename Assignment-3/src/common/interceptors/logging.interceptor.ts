import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const start = Date.now(); // timer starts before the handler runs
    const method: string = req.method;
    const path: string = req.originalUrl.split('?')[0]; // path only, so query-string secrets never reach the log

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `${method} ${path} ${res.statusCode} ${Date.now() - start}ms`,
          );
        },
        error: (err: unknown) => {
          const status = err instanceof HttpException ? err.getStatus() : 500;
          const line = `${method} ${path} ${status} ${Date.now() - start}ms`;
          if (status >= 500) this.logger.error(line);
          else this.logger.warn(line);
        },
      }),
    );
  }
}
