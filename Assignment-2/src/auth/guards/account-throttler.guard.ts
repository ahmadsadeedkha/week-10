import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AccountThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Key by email if present, falling back to IP so requests with no body
    // (malformed/missing email) still get throttled by something.
    const email = req.body?.email;
    return email ? `account:${email}` : req.ip;
  }
}
