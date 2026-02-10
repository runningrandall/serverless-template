import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./test/setup.ts'],
        include: ['test/**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json-summary'],
            reportsDirectory: './coverage',
            include: ['lib/**/*.ts', 'hooks/**/*.tsx', 'components/**/*.tsx', 'app/**/*.tsx'],
            exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', 'components/ui/**'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});
