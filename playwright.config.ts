import { defineConfig, devices } from '@playwright/test';
import { ENV } from './config/env.config.js';

export default defineConfig({
  testDir: './tests',
  timeout: ENV.DEFAULT_TIMEOUT,
  expect: {
    timeout: ENV.EXPECT_TIMEOUT,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    },
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : ENV.RETRIES,
  workers: process.env.CI ? 2 : ENV.WORKERS,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: ENV.BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: ENV.VIEWPORT_WIDTH, height: ENV.VIEWPORT_HEIGHT },
    actionTimeout: 15000,
    navigationTimeout: 30000,
    testIdAttribute: 'data-testid',
  },
  projects: [
    // Global Authentication Setup (Optional for tests needing pre-authenticated state)
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Desktop Chromium / Chrome (UI E2E, Hybrid, Visual, A11y)
    {
      name: 'chromium',
      testIgnore: /.*\.api\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },
    // API Testing Project (Runs purely headless with no browser overhead)
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts/,
      use: {
        baseURL: ENV.API_URL,
      },
    },
    // Mobile Viewport testing
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
      },
      testMatch: /.*\.visual\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
  outputDir: 'test-results',
});
