import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * Some sandboxes ship a Chromium that Playwright's own download step cannot
 * fetch. When one is present, point at it; in CI the normal
 * `npx playwright install --with-deps chromium` provides the browser and this
 * is skipped.
 */
const SANDBOX_CHROMIUM = '/opt/pw-browsers/chromium';
const launch = existsSync(SANDBOX_CHROMIUM) ? { executablePath: SANDBOX_CHROMIUM } : {};

export default defineConfig({
  testDir: 'tests/e2e',
  snapshotDir: 'tests/e2e/__screenshots__',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // A phone-shaped viewport; the mockups are all 300px screens.
        viewport: { width: 420, height: 900 },
        launchOptions: launch,
      },
    },
  ],
  webServer: {
    /*
     * --host 127.0.0.1 is load-bearing. Vite preview otherwise binds the name
     * "localhost", which on the GitHub runner resolves to ::1 first. Playwright's
     * readiness probe would then succeed over IPv6 while every test, using the
     * IPv4 baseURL below, got ECONNREFUSED. Binding and probing the same literal
     * address removes the ambiguity.
     */
    command: `npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  expect: {
    /*
     * The tolerance absorbs antialiasing jitter between runs on the same
     * runner, and nothing more.
     *
     * It was 0.01 — one per cent of a 420x900 shot, about 3,800 pixels. That is
     * larger than most components: reordering the whole bottom tab bar changed
     * fewer pixels than that and sailed through the gate, and because the
     * comparison passed, `--update-snapshots` then considered the baselines
     * unchanged and left images in the repo that no longer matched the app.
     * A gate that cannot see a navigation bar move is not gating anything.
     */
    toHaveScreenshot: { maxDiffPixelRatio: 0.002 },
  },
});
