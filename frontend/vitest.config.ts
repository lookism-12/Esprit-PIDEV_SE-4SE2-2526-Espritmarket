import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setup-vitest.ts'],
    include: ['src/**/*.spec.ts'],
    exclude: [
      'src/app/front/pages/profile/profile-notifications.spec.ts',
      'src/app/front/pages/negotiations/negotiations.spec.ts',
      'src/app/front/pages/notifications/notifications.spec.ts',
    ],
    reporters: ['default']
  }
});
