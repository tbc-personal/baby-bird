import type { Page } from '@playwright/test';

/**
 * The clock the end-to-end tests run against.
 *
 * The app reads the clock in exactly one place (`useToday` in App.tsx), which
 * is what makes overriding `Date` in the page enough to make "23 weeks, 0 days"
 * — and therefore week 23, the Atlantic Puffin — deterministic.
 *
 * This lives in its own file because it did not, and the omission was invisible
 * until it fired. `smoke.spec.ts` had a copy of it; `pwa.spec.ts` had none, so
 * its two offline tests asserted "Atlantic Puffin" against the real clock and
 * passed for exactly as long as the real week happened to be 23. On 2026-09-13
 * the reader's week rolled to 24 and both started failing on a Northern
 * Flicker.
 *
 * `skins.spec.ts` still carries its own copy. Its override is fused into the
 * same `addInitScript` that seeds localStorage, and that file drives the visual
 * baselines, so it is left alone deliberately rather than overlooked.
 */
export const FIXED_NOW = new Date('2026-09-06T12:00:00-04:00').valueOf();

/**
 * Pin the page's clock. The string form is used deliberately: Playwright
 * serializes a function argument, and the class syntax below survives that more
 * reliably as text.
 */
export async function pinClock(page: Page) {
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
