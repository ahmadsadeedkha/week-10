import { execSync } from 'node:child_process';

function assertTestDatabase() {
  const dbName = process.env.DB_DATABASE;
  const expected = 'cmit-week-10_test';

  if (dbName !== expected) {
    throw new Error(
      `\n\n🛑 REFUSING TO RUN: test suite is pointed at database "${dbName}", ` +
        `but expected exactly "${expected}".\n` +
        `This suite TRUNCATEs tables between every test — running it against ` +
        `the wrong database could permanently destroy real data.\n` +
        `Check that .env.test is loaded (not .env) and DB_DATABASE is correct.\n`,
    );
  }
}

export async function setup() {
  assertTestDatabase();

  execSync('npm run typeorm -- migration:run', {
    stdio: 'inherit',
    env: process.env,
  });
}
