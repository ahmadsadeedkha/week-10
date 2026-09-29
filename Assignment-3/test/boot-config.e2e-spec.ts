import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';

describe('Application boot — required config (C4)', () => {
  it('refuses to boot when JWT_SECRET is empty, and the error names the variable', () => {
    const childEnv = { ...process.env, JWT_SECRET: '' };

    const result = spawnSync('node', ['--import', 'tsx', 'src/main.ts'], {
      env: childEnv,
      encoding: 'utf-8',
      timeout: 10000,
    });

    expect(result.status).not.toBe(0);
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    expect(output).toContain('JWT_SECRET');
  });
});
