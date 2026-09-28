import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function registerAndLogin(app: INestApplication): Promise<string> {
  const user = {
    name: 'Ahmad Test',
    email: `test-user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'SecurePass123!',
  };

  const registerRes = await request(app.getHttpServer())
    .post('/auth/register')
    .send(user);
  if (registerRes.status !== 201) {
    throw new Error(
      `registerAndLogin: register failed (${registerRes.status}): ${JSON.stringify(registerRes.body)}`,
    );
  }

  const loginRes = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: user.email, password: user.password });
  if (loginRes.status !== 200) {
    throw new Error(
      `registerAndLogin: login failed (${loginRes.status}): ${JSON.stringify(loginRes.body)}`,
    );
  }

  return loginRes.body.access_token as string;
}
