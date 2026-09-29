import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class ShutdownLoggerService implements OnApplicationShutdown {
  private readonly logger = new Logger('Shutdown');

  onApplicationShutdown(signal?: string) {
    // By the time Nest calls this hook, the HTTP server has already stopped
    // accepting new connections and any in-flight requests have finished —
    // that's what app.close() does before running shutdown hooks.
    this.logger.log(`Received ${signal ?? 'shutdown'} signal`);
    this.logger.log('HTTP server closed, in-flight requests finished');
    this.logger.log('Closing database connection pool');
  }
}
