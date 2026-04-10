import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'unit',
      include: ['src/**/*.test.js'],
      exclude: ['src/**/*.integration.test.js'],
    },
  },
  {
    test: {
      name: 'integration',
      include: ['src/**/*.integration.test.js'],
      setupFiles: ['./setup.integration.js'],
    },
  },
]);
