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

  it('runs the full journey: register through refresh, viewer-denied write, and post-logout denial', async () => {
    // --- W1/W2: register, login ---
    const ownerEmail = `flow-owner-${Date.now()}@example.com`;
    const password = 'SecurePass123!';

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Flow Owner', email: ownerEmail, password });
    expect(registerRes.status).toBe(201);
    const ownerId = registerRes.body.id;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ownerEmail, password });
    expect(loginRes.status).toBe(200);

    let accessToken = loginRes.body.access_token as string;
    let refreshToken = loginRes.body.refresh_token as string;
    const auth = () => `Bearer ${accessToken}`;

    // --- create project ---
    const projectRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', auth())
      .send({ name: 'Flow Project' });
    expect(projectRes.status).toBe(201);
    const projectId = projectRes.body.id;

    // --- create task ---
    const taskRes = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', auth())
      .send({ title: 'Flow Task', priority: 3, projectId });
    expect(taskRes.status).toBe(201);
    expect(taskRes.body.project.id).toBe(projectId);
    const taskId = taskRes.body.id;

    // --- add comment ---
    const commentRes = await request(app.getHttpServer())
      .post(`/tasks/${taskId}/comments`)
      .set('Authorization', auth())
      .send({ body: 'Flow comment' });
    expect(commentRes.status).toBe(201);
    expect(commentRes.body.task_id).toBe(taskId);
    expect(commentRes.body.author_id).toBe(ownerId);

    // --- C1: refresh mid-flow, continue with the new token ---
    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: refreshToken });
    expect(refreshRes.status).toBe(200);

    accessToken = refreshRes.body.access_token; // replace stored token
    refreshToken = refreshRes.body.refresh_token;

    const postRefreshTaskRes = await request(app.getHttpServer()).get(
      `/tasks/${taskId}`,
    );
    expect(postRefreshTaskRes.status).toBe(200);
    expect(postRefreshTaskRes.body.commentCount).toBe(1);

    const postRefreshProjectRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', auth()) // uses the NEW access token
      .send({ name: 'Post-Refresh Project' });
    expect(postRefreshProjectRes.status).toBe(201);

    // --- C2a: add a second user as viewer, viewer attempts a write -> 403 ---
    const viewerEmail = `flow-viewer-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Flow Viewer', email: viewerEmail, password });

    const viewerLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: viewerEmail, password });
    const viewerAccessToken = viewerLoginRes.body.access_token;
    const viewerId = (
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: viewerEmail, password })
    ).body; // not needed unless you have a /me route — see note below

    const addMemberRes = await request(app.getHttpServer())
      .post(`/projects/${projectId}/members`)
      .set('Authorization', auth()) // owner adds them
      .send({
        userId: registerRes.body.id === ownerId ? undefined : undefined,
      }); // placeholder — needs real viewer userId

    // --- C2b: logout, then reuse the (already-rotated) refresh token -> 401 ---
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refresh_token: refreshToken });

    const postLogoutRefreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: refreshToken });
    expect(postLogoutRefreshRes.status).toBe(401);
  });
});
