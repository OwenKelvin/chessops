import { defineConfig } from 'vite';
import { vitest } from 'vitest/config';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-vite-ts-paths';
import { angular } from '@nx/angular/plugins/vite';

export default defineConfig({
  plugins: [nxViteTsPaths(), angular()],
  test: vitest({
    globals: true,
    environment: 'jsdom',
    include: ['**/*.spec.ts'],
    setupFiles: ['libs/ui/src/test-setup.ts'],
  }),
});
