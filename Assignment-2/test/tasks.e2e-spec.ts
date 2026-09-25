import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from './utils/setup-e2e-app.js';
import { resetDatabase } from './utils/db-reset.js';
import { registerAndLogin } from './utils/authHelpers.js';

describe('GET /tasks — combinable filters (X1)', () => {
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

  it('returns only the task matching both status and projectId, excluding near misses', async () => {
    const token = await registerAndLogin(app);
    const auth = (req: request.Test) =>
      req.set('Authorization', `Bearer ${token}`);

    const projectARes = await auth(
      request(app.getHttpServer()).post('/projects'),
    ).send({ name: 'Project A' });
    const projectBRes = await auth(
      request(app.getHttpServer()).post('/projects'),
    ).send({ name: 'Project B' });

    const projectAId = projectARes.body.id;
    const projectBId = projectBRes.body.id;

    // Matches BOTH filters — the row we expect back
    const matchRes = await auth(
      request(app.getHttpServer()).post('/tasks'),
    ).send({
      title: 'Matches both filters',
      priority: 3,
      projectId: projectAId,
      status: 'todo',
    });

    // Near miss: right project, wrong status
    await auth(request(app.getHttpServer()).post('/tasks')).send({
      title: 'Right project, wrong status',
      priority: 3,
      projectId: projectAId,
      status: 'in_progress',
    });

    // Near miss: right status, wrong project
    await auth(request(app.getHttpServer()).post('/tasks')).send({
      title: 'Right status, wrong project',
      priority: 3,
      projectId: projectBId,
      status: 'todo',
    });

    const res = await auth(
      request(app.getHttpServer()).get(
        `/tasks?status=todo&projectId=${projectAId}`,
      ),
    );

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe(matchRes.body.id);
    expect(res.body.items[0].title).toBe('Matches both filters');
    expect(res.body.total).toBe(1);
  });

  it('lists comments on a task via GET /tasks/:id/comments', async () => {
    const token = await registerAndLogin(app);
    const projectRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Comments Project' });
    const projectId = projectRes.body.id;

    const taskRes = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Commented Task', priority: 2, projectId });
    const taskId = taskRes.body.id;

    await request(app.getHttpServer())
      .post(`/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'First comment' });

    const res = await request(app.getHttpServer()).get(
      `/tasks/${taskId}/comments`,
    );
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].body).toBe('First comment');
  });
});
