import { expect, test, type Page } from '@playwright/test';

/**
 * ADR-007 visual regression: one screenshot of Today per skin, light and dark.
 * The clock is pinned so the content is identical across all fourteen shots and
 * only the palette and typefaces differ.
 */
const FIXED_NOW = new Date('2026-09-06T12:00:00-04:00').valueOf();

const SKINS = [
  'puffin',
  'kingfisher',
  'bluebird',
  'heron',
  'oriole',
  'goldfinch',
  'cardinal',
] as const;

async function openToday(page: Page, skin: string) {
  // The string form is used deliberately: Playwright serializes a function
  // argument, and the class syntax below survives that more reliably as text.
  await page.addInitScript(`{
    const fixed = ${FIXED_NOW};
    const RealDate = Date;
    class FakeDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) super(fixed);
        else super(...args);
      }
      static now() { return fixed; }
    }
    globalThis.Date = FakeDate;
    // Seed only when empty: this script re-runs on every navigation, and a
    // reload must read back what the app wrote, not this fixture.
    try {
      if (!window.localStorage.getItem('nestling.v1'))
      window.localStorage.setItem('nestling.v1', JSON.stringify({
        version: 1,
        method: 'lmp',
        inputDate: '2026-03-29',
        settings: { units: 'imperial', laborPanelEnabled: true, skin: ${JSON.stringify(skin)} },
      }));
    } catch {}
  }`);
  await page.goto('/#/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('23 weeks');
  await page.evaluate(() => document.fonts.ready);
}

for (const skin of SKINS) {
  for (const theme of ['light', 'dark'] as const) {
    test(`Today in the ${skin} skin, ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await openToday(page, skin);
      await expect(page).toHaveScreenshot(`today-${skin}-${theme}.png`, {
        fullPage: true,
      });
    });
  }
}

test('the skin picker applies and persists a choice', async ({ page }) => {
  await openToday(page, 'puffin');
  // The skin picker lives on Setup now that Setup and About are one page. The
  // tab is the sliders mark, so it is found by its accessible name.
  await page
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('link', { name: 'Setup' })
    .click();

  await expect(page.locator('html')).toHaveAttribute('data-skin', 'puffin');
  await page.getByRole('radio', { name: /Cardinal/ }).check();
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'cardinal');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'cardinal');
  await expect(page.getByRole('radio', { name: /Cardinal/ })).toBeChecked();
});
