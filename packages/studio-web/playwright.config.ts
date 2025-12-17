import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: (process.env.CI ? 25 : 50) * 1000,
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry only twice in CI */
  retries: process.env.CI ? 2 : 3,
  /* Use 4 parallel workers in CI, the default otherwise (#CPUs I think). */
  workers: process.env.CI ? 4 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [["html", { open: "never" }]] : "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:4200",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    testIdAttribute: "data-test-id",
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  /* Only test chromium on CI */
  projects: process.env.CI
    ? [
        {
          name: "chromium",
          use: {
            ...devices["Desktop Chrome"],
            contextOptions: {
              permissions: ["clipboard-read", "clipboard-write"],
            },
          },
        },
        {
          name: "Mobile Chrome",
          use: {
            ...devices["Pixel 5"],
            contextOptions: {
              permissions: ["clipboard-read", "clipboard-write"],
            },
          },
        },
      ]
    : [
        {
          name: "chromium",
          use: {
            ...devices["Desktop Chrome"],
            contextOptions: {
              permissions: ["clipboard-read", "clipboard-write"],
            },
          },
        },

        {
          name: "firefox",
          use: { ...devices["Desktop Firefox"] },
        },
        /* We do not have full webkit support
        {
          name: "webkit",
          use: { ...devices["Desktop Safari"] },
        },

        /* Test against mobile viewports. */
        {
          name: "Mobile Chrome",
          use: {
            ...devices["Pixel 5"],
            contextOptions: {
              permissions: ["clipboard-read", "clipboard-write"],
            },
          },
        },
        /*
        {
          name: "Mobile Safari",
          use: { ...devices["iPhone 12"] },
        },

    /* Test against branded browsers. */
        // {
        //   name: 'Microsoft Edge',
        //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
        // },
        // {
        //   name: 'Google Chrome',
        //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        // },
      ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
