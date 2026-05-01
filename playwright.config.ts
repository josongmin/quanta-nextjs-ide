import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const runRealNextjs = !!process.env.RUN_REAL_NEXTJS;

export default defineConfig({
  testDir: './e2e',
  testMatch: runRealNextjs
    ? /real-nextjs\.spec\.ts$/
    : /^(?!.*real-nextjs).*\.spec\.ts$/,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: runRealNextjs ? 'http://localhost:5174' : 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: runRealNextjs
    ? [
        {
          // Real Next.js 15 fixture app on :3001
          command: 'npm run dev --prefix e2e/fixtures/next-app',
          url: 'http://localhost:3001/',
          reuseExistingServer: !isCI,
          stdout: 'pipe',
          stderr: 'pipe',
          timeout: 60_000,
        },
        {
          // IDE on :5174 with proxy pointed at real Next (:3001)
          command:
            'VITE_NEXT_DEV_URL=http://localhost:3001 npm run dev -- --port 5174 --strictPort',
          url: 'http://localhost:5174',
          reuseExistingServer: !isCI,
          stdout: 'pipe',
          stderr: 'pipe',
          timeout: 30_000,
        },
      ]
    : [
        {
          // Fake RSC server on :3000 for the standard mock-driven suite
          command: 'node e2e/fixtures/fake-rsc-server.mjs',
          url: 'http://localhost:3000/__health',
          reuseExistingServer: !isCI,
          stdout: 'pipe',
          stderr: 'pipe',
          timeout: 10_000,
        },
        {
          // IDE on :5173 with proxy pointed at fake server (:3000, the default)
          command: 'npm run dev -- --port 5173 --strictPort',
          url: 'http://localhost:5173',
          reuseExistingServer: !isCI,
          stdout: 'pipe',
          stderr: 'pipe',
          timeout: 30_000,
        },
      ],
});
