import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from './utils/setup-e2e-app.js';
import { resetDatabase } from './utils/db-reset.js';

describe('POST /auth/refresh — forged secret (X2)', () => {
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

  it('rejects a real token id paired with the wrong secret, and leaves the real token usable', async () => {
    const email = `forge-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const password = 'SecurePass123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Forge Target', email, password });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
    expect(loginRes.status).toBe(200);

    // Real token looks like "<id>.<secret>" — keep the real id, forge the secret
    const realToken = loginRes.body.refresh_token as string;
    const [tokenId] = realToken.split('.');
    const forgedToken = `${tokenId}.${'0'.repeat(128)}`;

    const forgedRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: forgedToken });
    expect(forgedRes.status).toBe(401);

    // The real token must still work: the 401 above came from the secret
    // check, not from the token being broken or revoked.
    const realRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: realToken });
    expect(realRes.status).toBe(200);
  });
});
