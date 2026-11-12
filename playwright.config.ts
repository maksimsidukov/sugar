import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    locale: 'ru-RU',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile',
      testMatch: 'app.spec.ts',
      use: { baseURL: 'http://127.0.0.1:5173/sugar/' },
    },
    {
      name: 'offline',
      testMatch: 'offline.spec.ts',
      use: { baseURL: 'http://127.0.0.1:4173/sugar/' },
    },
  ],
  webServer: [
    {
      command: 'npm run dev -- --port 5173',
      url: 'http://127.0.0.1:5173/sugar/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run build && npm run preview -- --port 4173',
      url: 'http://127.0.0.1:4173/sugar/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
