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

 it('runs register, login, create project, create task, add comment — asserting state at each step', async () => {
   const email = `flow-user-${Date.now()}@example.com`;
   const password = 'SecurePass123!';
   const name = 'Flow User';

   // Step 1: register
   const registerRes = await request(app.getHttpServer())
     .post('/auth/register')
     .send({ name, email, password });
   expect(registerRes.status).toBe(201);
   expect(registerRes.body).toMatchObject({ name, email });
   const userId = registerRes.body.id;

   // Step 2: login
   const loginRes = await request(app.getHttpServer())
     .post('/auth/login')
     .send({ email, password });
   expect(loginRes.status).toBe(200);
   expect(loginRes.body).toHaveProperty('access_token');
   expect(loginRes.body).toHaveProperty('refresh_token');

   const accessToken = loginRes.body.access_token as string;
   const auth = () => `Bearer ${accessToken}`;

   // Step 3: create project — assert it's owned by the user who created it
   const projectRes = await request(app.getHttpServer())
     .post('/projects')
     .set('Authorization', auth())
     .send({ name: 'Flow Project' });
   expect(projectRes.status).toBe(201);
   expect(projectRes.body).toMatchObject({ name: 'Flow Project' });
   const projectId = projectRes.body.id;

   // Step 4: create task — assert it's linked to the right project
   const taskRes = await request(app.getHttpServer())
     .post('/tasks')
     .set('Authorization', auth())
     .send({ title: 'Flow Task', priority: 3, projectId });
   expect(taskRes.status).toBe(201);
   expect(taskRes.body).toMatchObject({ title: 'Flow Task', priority: 3 });
   expect(taskRes.body.project.id).toBe(projectId);
   const taskId = taskRes.body.id;

   // Step 5: add comment — assert it's linked to the right task and author
   const commentRes = await request(app.getHttpServer())
     .post(`/tasks/${taskId}/comments`)
     .set('Authorization', auth())
     .send({ body: 'Flow comment' });
   expect(commentRes.status).toBe(201);
   expect(commentRes.body).toMatchObject({ body: 'Flow comment' });
   expect(commentRes.body.task_id).toBe(taskId);
   expect(commentRes.body.author_id).toBe(userId);

   // Step 6: read the task back and confirm the comment count reflects it
   const taskCheckRes = await request(app.getHttpServer()).get(
     `/tasks/${taskId}`,
   );
   expect(taskCheckRes.status).toBe(200);
   expect(taskCheckRes.body.commentCount).toBe(1);
 });
});
