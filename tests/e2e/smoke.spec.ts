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

  // Tapping a row lands in the same browsing view the header arrows drive, not
  // on a separate screen: full header, working arrows, a way back.
  await page.locator('a.row[href="#/week/29"]').click();
  await expect(page).toHaveURL(/#\/week\/29$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Week 29');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('6 weeks ahead');
  await expect(page.getByText('October 18–24')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Next week' })).toBeVisible();

  // The arrows carry on from where the timeline dropped you.
  await page.getByRole('link', { name: 'Next week' }).click();
  await expect(page).toHaveURL(/#\/week\/30$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Week 30');

  // And back to the present week.
  await page.getByRole('link', { name: 'back to this week' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('23 weeks, 0 days');

  // The deep link works on its own.
  await page.goto('/#/week/42');
  await expect(page.getByRole('heading', { level: 2 })).toContainText('Osprey');

  // A week outside the table says so rather than silently clamping to 42.
  await page.goto('/#/week/99');
  await expect(page.getByText('No comparison for week 99')).toBeVisible();
});

/**
 * The tab bar is sticky and overlaps whatever scrolls under it. Each skin
 * swatch carries a transparent full-card <input> at z-index 1, so before the
 * bar was given a layer of its own it sat below those inputs: aiming at
 * Timeline over a swatch changed your skin instead of navigating.
 *
 * Asserted with elementFromPoint rather than a click. Playwright's click does
 * an actionability check and would time out on a covered target rather than
 * hit the wrong element, so a click passes whether or not the bar is layered
 * correctly. What actually broke is which element is on top at that point, so
 * that is what this measures.
 */
test('the tab bar is the hit target where it overlaps a skin swatch', async ({ page }) => {
  await page.addInitScript(`{
    try { localStorage.setItem('nestling.v1', JSON.stringify({
      version: 2, method: 'lmp', inputDate: '2026-03-29', cycleLength: 28,
      settings: { units: 'imperial', laborPanelEnabled: true, skin: 'puffin' } })); } catch {}
  }`);
  await page.goto('/#/setup');

  // Scroll until a swatch is behind the bar, which is the situation the bug
  // needs; if nothing ever overlaps, the test would pass for the wrong reason.
  // Every tab is checked, not just one: the middle tab's centre happens to
  // fall in the gutter between the two swatch columns.
  const overlapped = await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('.tabs a')];
    const swatches = [...document.querySelectorAll('.skin')];
    const misses: string[] = [];
    let checked = 0;

    for (let y = 0; y < document.body.scrollHeight; y += 40) {
      window.scrollTo(0, y);
      for (const tab of tabs) {
        const bar = tab.getBoundingClientRect();
        const x = bar.left + bar.width / 2;
        const cy = bar.top + bar.height / 2;
        const under = swatches.some((s) => {
          const r = s.getBoundingClientRect();
          return r.left <= x && r.right >= x && r.top <= cy && r.bottom >= cy;
        });
        if (!under) continue;

        checked += 1;
        const hit = document.elementFromPoint(x, cy);
        if (!(hit === tab || tab.contains(hit))) {
          const name = tab.getAttribute('aria-label') ?? tab.textContent ?? '?';
          const got = hit ? `${hit.tagName}.${String(hit.className)}` : 'nothing';
          misses.push(`${name} -> ${got}`);
        }
      }
    }
    return { checked, misses: [...new Set(misses)] };
  });

  expect(overlapped.checked, 'no skin swatch ever sat under the tab bar').toBeGreaterThan(0);
  expect(overlapped.misses, 'a tap on the bar would hit the page underneath').toEqual([]);
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
