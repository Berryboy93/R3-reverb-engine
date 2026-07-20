import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  webServer: {
    command: 'npm run dev',
    port: 5000,
    reuseExistingServer: true,
    timeout: 120_000,
  },

  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium-autoplay-blocked',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--autoplay-policy=user-gesture-required',
            // Required for AudioWorklet / AudioContext in headless Chrome
            '--enable-features=SharedArrayBuffer',
            '--no-sandbox',
          ],
        },
      },
    },
  ],
});
