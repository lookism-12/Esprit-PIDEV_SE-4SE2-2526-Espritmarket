import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'path';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, 'src/vitest.setup.ts')], // Using absolute path for CI reliability
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules'],
    // Using default pool for stability
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
