import { expect, test } from '@playwright/test';

/**
 * Installability, checked against the criteria themselves.
 *
 * Lighthouse 12 removed the PWA category, so there is no longer a
 * "PWA installability" score to point at. These assertions are the criteria
 * Chromium actually applies: a manifest with a name, a start URL, a standalone
 * display mode and a 192px and a 512px icon, plus a service worker with a fetch
 * handler. Checking them directly is also stricter than a category score, since
 * a failure names the missing field.
 */
test('the manifest meets the installability criteria', async ({ page, request }) => {
  await page.goto('/');

  const href = await page.getAttribute('link[rel="manifest"]', 'href');
  expect(href, 'the page links a manifest').toBeTruthy();

  const response = await request.get(new URL(href ?? '', page.url()).toString());
  expect(response.status()).toBe(200);

  const manifest = (await response.json()) as {
    name?: string;
    short_name?: string;
    start_url?: string;
    display?: string;
    icons?: { src: string; sizes: string; type: string; purpose?: string }[];
  };

  expect(manifest.name).toBe('Nestling');
  expect(manifest.short_name).toBe('Nestling');
  expect(manifest.start_url).toBeTruthy();
  expect(['standalone', 'fullscreen', 'minimal-ui']).toContain(manifest.display);

  const sizes = (manifest.icons ?? []).map((icon) => icon.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
  expect(manifest.icons?.some((icon) => icon.purpose === 'maskable')).toBe(true);

  // Every icon the manifest promises must actually be served.
  for (const icon of manifest.icons ?? []) {
    const iconResponse = await request.get(new URL(icon.src, page.url()).toString());
    expect(iconResponse.status(), `${icon.src} is served`).toBe(200);
    expect(Number(iconResponse.headers()['content-length'] ?? '1')).toBeGreaterThan(0);
  }
});

test('a service worker registers and controls the page', async ({ page }) => {
  await page.goto('/');
  const registered = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    return Boolean(registration.active);
  });
  expect(registered).toBe(true);
});

test('the app shell works with the network cut off', async ({ page, context }) => {
  await page.addInitScript(`{
    try { if (!localStorage.getItem('nestling.v1')) localStorage.setItem('nestling.v1', JSON.stringify({
      version: 1, method: 'lmp', inputDate: '2026-03-29',
      settings: { units: 'imperial', laborPanelEnabled: true, skin: 'puffin' } })); } catch {}
  }`);
  await page.goto('/');
  // Let the service worker finish precaching before pulling the plug.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(1500);

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { level: 2 })).toContainText('Atlantic Puffin');
  // Facts and sizes are bundled, so they still render (mockup 5).
  await expect(page.getByText(/carries a dozen or more small fish/)).toBeVisible();
  await context.setOffline(false);
});

test('a shared link is never written to the cache (ADR-006)', async ({ page }) => {
  /*
   * The risk this guards is a shared machine: one person opens a
   * ?m=lmp&d=YYYY-MM-DD link, and the next person finds that date in the cache.
   * Workbox's own precache entries carry a __WB_REVISION__ parameter, which is
   * a build-asset revision marker and not user data, so those are excluded
   * rather than the whole test being loosened.
   */
  await page.goto('/?m=lmp&d=2026-03-29');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(1200);
  await page.reload();
  await page.waitForTimeout(800);

  const leaked = await page.evaluate(async () => {
    const found: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        const url = new URL(request.url);
        const params = new URLSearchParams(url.search);
        params.delete('__WB_REVISION__');
        if ([...params.keys()].length > 0) found.push(request.url);
      }
    }
    return found;
  });

  expect(leaked, 'no cache entry may carry user parameters').toEqual([]);
});

test('no cross-origin request is made on load (ADR-003)', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.host !== '127.0.0.1:4173' && url.protocol !== 'data:')
      external.push(request.url());
  });
  await page.goto('/#/');
  await page.waitForTimeout(1200);
  // No analytics, no Google Fonts, no third-party scripts. The only permitted
  // cross-origin traffic is a Macaulay embed frame, and no row carries one yet.
  expect(external).toEqual([]);
});
