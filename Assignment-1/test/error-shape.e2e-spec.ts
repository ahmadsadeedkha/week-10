// test/error-shape.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/setup-e2e-app.js';
import { resetDatabase } from './utils/db-reset.js';

describe('Global exception filter — error shape (C5)', () => {
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

  it('returns all five required fields on a 400 (validation failure)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email' }); // missing name/password too — guaranteed 400

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('statusCode', 400);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('path', '/auth/register');

    // Confirm timestamp is a real, parseable ISO date — not just present
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('returns all five required fields on a 404 (resource not found)', async () => {
    const res = await request(app.getHttpServer()).get('/tasks/999999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('statusCode', 404);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('path', '/tasks/999999');
  });
});
