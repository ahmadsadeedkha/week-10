// test/projects.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from './utils/setup-e2e-app.js';
import { resetDatabase } from './utils/db-reset.js';
import { registerAndLogin } from './utils/authHelpers.js';

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

  it('creates a project via POST and reads it back via GET', async () => {
    const token = await registerAndLogin(app);

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
    const token = await registerAndLogin(app);

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

  it('returns 404 when reading a project that does not exist', async () => {
    const res = await request(app.getHttpServer()).get('/projects/999999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('statusCode', 404);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 403 (not 404) when updating a project that does not exist', async () => {
    const token = await registerAndLogin(app);

    const res = await request(app.getHttpServer())
      .patch('/projects/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });

    // RolesGuard checks project_members before the service checks existence,
    // so a nonexistent project has no membership rows and always 403s here —
    // see PR notes: existence is never reached for update/delete on a missing id.
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('statusCode', 403);
  });

  it('returns 403 (not 404) when deleting a project that does not exist', async () => {
    const token = await registerAndLogin(app);

    const res = await request(app.getHttpServer())
      .delete('/projects/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('statusCode', 403);
  });

  it('rejects an unknown field in the body and creates no row with that value (X2)', async () => {
    const token = await registerAndLogin(app);

    const res = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sneaky Project', ownerId: 999999 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('statusCode', 400);

    // Confirm nothing was persisted at all — not just that the field was stripped
    const allProjects = await dataSource.query(
      'SELECT * FROM projects WHERE name = $1',
      ['Sneaky Project'],
    );
    expect(allProjects).toHaveLength(0);
  });
});
