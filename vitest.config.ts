import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    globalSetup: 'src/test-utils/test-global-setup.ts',
  },
});
