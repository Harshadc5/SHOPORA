import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.test.js'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.js'],
    },
  },
});
