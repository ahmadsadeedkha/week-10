import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from './utils/setup-e2e-app.js';
import { resetDatabase } from './utils/db-reset.js';

describe('End-to-end journey (W1)', () => {
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

  it('runs register, login, create project, create task, add comment as one flow', async () => {
    const email = `flow-user-${Date.now()}@example.com`;
    const password = 'SecurePass123!';

    // Step 1: register
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Flow User', email, password });
    expect(registerRes.status).toBe(201);

    // Step 2: login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
    expect(loginRes.status).toBe(200);

    let accessToken = loginRes.body.access_token as string;
    const auth = () => `Bearer ${accessToken}`;

    // Step 3: create project
    const projectRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', auth())
      .send({ name: 'Flow Project' });
    expect(projectRes.status).toBe(201);
    const projectId = projectRes.body.id;

    // Step 4: create task in that project
    const taskRes = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', auth())
      .send({ title: 'Flow Task', priority: 3, projectId });
    expect(taskRes.status).toBe(201);
    const taskId = taskRes.body.id;

    // Step 5: add comment on that task
    const commentRes = await request(app.getHttpServer())
      .post(`/tasks/${taskId}/comments`)
      .set('Authorization', auth())
      .send({ body: 'Flow comment' });
    expect(commentRes.status).toBe(201);
  });
});
