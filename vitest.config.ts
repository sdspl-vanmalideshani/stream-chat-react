import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react],
  test: {
    globalSetup: './jest-global-setup.js',
    environment: 'jsdom',
    globals: true,
    include: ['./src/**/__tests__/*'],
  },
});
