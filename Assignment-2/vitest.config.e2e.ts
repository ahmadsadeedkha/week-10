import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    hookTimeout: 30000, // DB connection + migrations can outrun the 10s default
    fileParallelism: false,
    sequence: {
      shuffle: true, // C4: prove order-independence
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.service.ts'], // scoped to services, per the assignment
      exclude: ['src/**/*.spec.ts', 'src/**/*.module.ts'],
      thresholds: {
        statements: 70,
        perFile: true,
      },
    },
  },
});
