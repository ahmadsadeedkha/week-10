// test/projects.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from './utils/setup-e2e-app.js';
import { resetDatabase } from './utils/db-reset.js';

describe('POST /projects — create then read back (C1)', () => {
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

  async function registerAndLogin() {
    const user = {
      name: 'Ahmad Test',
      email: `project-owner-${Date.now()}@example.com`,
      password: 'SecurePass123!',
    };

    await request(app.getHttpServer()).post('/auth/register').send(user);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password });

    return loginRes.body.access_token as string;
  }

  it('creates a project via POST and reads it back via GET', async () => {
    const token = await registerAndLogin();

    const createRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project' });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty('id');
    expect(createRes.body).toHaveProperty('name', 'Test Project');

    const projectId = createRes.body.id;

    const getRes = await request(app.getHttpServer()).get(
      `/projects/${projectId}`,
    );

    expect(getRes.status).toBe(200);
    expect(getRes.body).toMatchObject({
      id: projectId,
      name: 'Test Project',
    });
  });

  it('returns 401 when creating a project with no token', async () => {
    const res = await request(app.getHttpServer())
      .post('/projects')
      .send({ name: 'No Auth Project' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('statusCode', 401);
    expect(res.body).toHaveProperty('message', 'Unauthorized');
    expect(res.body).toHaveProperty('path', '/projects');
  });

  it('returns 400 when creating a project with an invalid body', async () => {
    const token = await registerAndLogin();

    const res = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // missing required `name`

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('statusCode', 400);
    expect(res.body).toHaveProperty('message');
    expect(
      Array.isArray(res.body.message) || typeof res.body.message === 'string',
    ).toBe(true);
  });
});
