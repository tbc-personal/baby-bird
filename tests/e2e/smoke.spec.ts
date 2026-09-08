import { expect, test, type Page } from '@playwright/test';

/**
 * The happy path from the build prompt: setup → today → timeline → week card.
 * The clock is pinned to 2026-09-06 so "23 weeks, 0 days" is deterministic;
 * the app reads the clock in exactly one place (`useToday` in App.tsx), which
 * is what makes a fixed clock enough.
 */
const FIXED_NOW = new Date('2026-09-06T12:00:00-04:00').valueOf();

async function pinClock(page: Page) {
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
  }`);
}

test.beforeEach(async ({ page }) => {
  await pinClock(page);
});

test('setup, today, timeline and the week card', async ({ page }) => {
  await page.goto('/#/setup');

  await expect(page.getByRole('heading', { name: 'Nestling' })).toBeVisible();

  await page.getByLabel('Count from').selectOption('lmp');
  await page.getByLabel('First day of last period').fill('2026-03-29');

  // The preview updates live, before anything is saved.
  await expect(page.getByText('January 3, 2027')).toBeVisible();
  await expect(page.getByText('23 weeks, 0 days').first()).toBeVisible();

  await page.getByRole('button', { name: 'Show me my nestling' }).click();

  // Today
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('23 weeks, 0 days');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('119 days to go');
  await expect(page.getByText('Second trimester')).toBeVisible();
  await expect(page.getByText('due Jan 3')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toContainText('Atlantic Puffin');
  await expect(page.getByText('Your baby is roughly the size of an')).toBeVisible();
  await expect(page.getByText('Fratercula arctica')).toBeVisible();

  // The date survives a reload (ADR-006).
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('23 weeks, 0 days');

  // Timeline highlights the current week and opens scrolled to it.
  await page.getByRole('link', { name: 'Timeline' }).click();
  const current = page.locator('[data-current-week="true"]');
  await expect(current).toContainText('Atlantic Puffin');
  await expect(current).toContainText('this week');
  await expect(current).toBeInViewport();

  // The convention divider sits between weeks 20 and 21.
  await expect(page.getByText('crown to rump · ▼ head to heel')).toBeAttached();

  // Tapping the row opens that week's card.
  await current.click();
  await expect(page).toHaveURL(/#\/week\/23$/);
  await expect(page.getByRole('heading', { level: 2 })).toContainText('Atlantic Puffin');

  // And the deep link works on its own.
  await page.goto('/#/week/42');
  await expect(page.getByRole('heading', { level: 2 })).toContainText('Osprey');
});

test('the info panel opens and closes', async ({ page }) => {
  await page.goto('/#/setup');
  const info = page.getByRole('button', { name: 'How each method is calculated' });

  const panel = page.getByText('due = date + 266 d');

  // Assert on the panel itself, not only on aria-expanded. The original bug
  // was CSS: `display: grid` outranked the user-agent `[hidden]` rule, so the
  // panel stayed on screen while the attribute flipped correctly underneath it.
  await expect(info).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();

  await info.click();
  await expect(info).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(info).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();

  await info.click();
  await expect(panel).toBeVisible();
  await page.getByText(/size, week by week/).click();
  await expect(info).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
});
