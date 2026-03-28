import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'path';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/vitest.setup.ts'],
    include: ['src/**/*.spec.ts'],
    pool: 'threads', // Faster and better for sharing initialized TestBed
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
