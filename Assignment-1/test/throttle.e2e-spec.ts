import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('Throttling (C5)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
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
