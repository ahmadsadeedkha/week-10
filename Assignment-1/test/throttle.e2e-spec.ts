import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/setup-e2e-app.js';
import { resetDatabase } from './utils/db-reset.js';

describe('Throttling (C5)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
  });

  afterEach(async () => {
    await resetDatabase(dataSource);
  });
  
  afterAll(async () => {
    await app.close();
  });

  it('returns 429 after exceeding the login rate limit, and still succeeds at a normal pace', async () => {
    const uniqueEmail = `throttle-test-${Date.now()}@example.com`;

    const responses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: uniqueEmail, password: 'wrong-password' });
      responses.push(res.status);
    }

    expect(responses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(responses[5]).toBe(429);
  });
});
