import { Controller, Get, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { DataSource } from 'typeorm';

type CheckResult = 'up' | 'down';

@SkipThrottle() // monitors poll often; don't rate-limit them
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    const database = await this.checkDatabase();
    const healthy = database === 'up';

    // A 200 is what load balancers and orchestrators read, so an unhealthy
    // service has to answer with a non-2xx status, not just a different body.
    res.status(healthy ? 200 : 503);

    return { status: healthy ? 'ok' : 'error', checks: { database } };
  }

  private async checkDatabase(): Promise<CheckResult> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'up';
    } catch {
      return 'down';
    }
  }
}
