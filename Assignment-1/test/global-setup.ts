import { execSync } from 'node:child_process';

export async function setup() {
  execSync('npm run typeorm -- migration:run', {
    stdio: 'inherit',
    env: process.env,
  });
}
