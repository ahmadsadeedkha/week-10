import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from './utils/setup-e2e-app.js';
import { resetDatabase } from './utils/db-reset.js';
import { registerAndLogin } from './utils/authHelpers.js';

describe('Projects — CRUD success paths and member edge cases', () => {
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

  it('lists all projects via GET /projects', async () => {
    const token = await registerAndLogin(app);
    await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Listed Project' });

    const res = await request(app.getHttpServer()).get('/projects');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((p: any) => p.name === 'Listed Project')).toBe(true);
  });

  it('owner successfully updates their own project', async () => {
    const token = await registerAndLogin(app);
    const createRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Original Name' });
    const projectId = createRes.body.id;

    const updateRes = await request(app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Updated Name');

    const getRes = await request(app.getHttpServer()).get(
      `/projects/${projectId}`,
    );
    expect(getRes.body.name).toBe('Updated Name');
  });

  it('owner successfully deletes their own project', async () => {
    const token = await registerAndLogin(app);
    const createRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Be Deleted' });
    const projectId = createRes.body.id;

    const deleteRes = await request(app.getHttpServer())
      .delete(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await request(app.getHttpServer()).get(
      `/projects/${projectId}`,
    );
    expect(getRes.status).toBe(404);
  });

  it('returns 403 (not 404) adding a member to a nonexistent project', async () => {
    const token = await registerAndLogin(app);
    const res = await request(app.getHttpServer())
      .post('/projects/999999/members')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: 1, role: 'viewer' });

    expect(res.status).toBe(403);
  });

  it('returns 404 adding a nonexistent user as a member', async () => {
    const token = await registerAndLogin(app);
    const createRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Member Test Project' });
    const projectId = createRes.body.id;

    const res = await request(app.getHttpServer())
      .post(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: 999999, role: 'viewer' });
    expect(res.status).toBe(404);
  });

  it('returns 409 adding a user who is already a member', async () => {
    const ownerToken = await registerAndLogin(app);
    const createRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Conflict Test Project' });
    const projectId = createRes.body.id;

    const memberEmail = `member-${Date.now()}@example.com`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'New Member',
        email: memberEmail,
        password: 'SecurePass123!',
      });
    const memberId = registerRes.body.id;

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: memberId, role: 'viewer' });

    const duplicateRes = await request(app.getHttpServer())
      .post(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: memberId, role: 'admin' });

    expect(duplicateRes.status).toBe(409);
  });
});
