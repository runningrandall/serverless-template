import { defineConfig } from 'vitest/config';

/**
 * Vitest config for integration tests.
 * These tests require DynamoDB Local to be running (pnpm db:start).
 * Run with: pnpm --filter backend test:integration
 */
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['test/integration/**/*.test.ts'],
        testTimeout: 30_000,
        hookTimeout: 20_000,
    },
});
