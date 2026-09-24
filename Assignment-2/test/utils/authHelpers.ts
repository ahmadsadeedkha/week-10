import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function registerAndLogin(app: INestApplication): Promise<string> {
  const user = {
    name: 'Ahmad Test',
    email: `test-user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'SecurePass123!',
  };

  await request(app.getHttpServer()).post('/auth/register').send(user);

  const loginRes = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: user.email, password: user.password });

  return loginRes.body.access_token as string;
}
