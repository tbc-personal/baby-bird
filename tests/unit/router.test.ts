import { describe, expect, it } from 'vitest';
import { activeTab, hrefFor, parseHash, type Route } from '../../src/lib/router';

describe('parseHash', () => {
  it.each([
    ['', { name: 'today' }],
    ['#', { name: 'today' }],
    ['#/', { name: 'today' }],
    ['#/setup', { name: 'setup' }],
    ['#/setup/', { name: 'setup' }],
    ['#/timeline', { name: 'timeline' }],
    ['#/about', { name: 'about' }],
    ['#/labor', { name: 'labor' }],
    ['#/week/23', { name: 'week', week: 23 }],
    ['#/week/2', { name: 'week', week: 2 }],
    ['#/week/23?review=1', { name: 'week', week: 23 }],
    ['#/?m=lmp&d=2026-03-29', { name: 'today' }],
    ['#/nope', { name: 'today' }],
    ['#/week/abc', { name: 'today' }],
    ['#/week/', { name: 'today' }],
    ['#/week/2.5', { name: 'today' }],
  ] as ReadonlyArray<readonly [string, Route]>)('%s', (hash, expected) => {
    expect(parseHash(hash)).toEqual(expected);
  });
});

describe('hrefFor', () => {
  it.each([
    [{ name: 'today' }, '#/'],
    [{ name: 'setup' }, '#/setup'],
    [{ name: 'timeline' }, '#/timeline'],
    [{ name: 'about' }, '#/about'],
    [{ name: 'labor' }, '#/labor'],
    [{ name: 'week', week: 23 }, '#/week/23'],
  ] as ReadonlyArray<readonly [Route, string]>)('%o → %s', (route, expected) => {
    expect(hrefFor(route)).toBe(expected);
  });

  it('round-trips every route through parseHash', () => {
    const routes: Route[] = [
      { name: 'setup' },
      { name: 'today' },
      { name: 'timeline' },
      { name: 'about' },
      { name: 'labor' },
      { name: 'week', week: 42 },
    ];
    for (const route of routes) {
      expect(parseHash(hrefFor(route))).toEqual(route);
    }
  });
});

describe('activeTab', () => {
  it.each([
    [{ name: 'setup' }, 'setup'],
    [{ name: 'today' }, 'today'],
    [{ name: 'timeline' }, 'timeline'],
    [{ name: 'about' }, 'about'],
    // A week card and the labor detail keep the Today tab lit (mockup 4).
    [{ name: 'week', week: 23 }, 'today'],
    [{ name: 'labor' }, 'today'],
  ] as ReadonlyArray<readonly [Route, string]>)('%o → %s', (route, expected) => {
    expect(activeTab(route)).toBe(expected);
  });
});
