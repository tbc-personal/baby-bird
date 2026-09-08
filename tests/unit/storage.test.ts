import { describe, expect, it } from 'vitest';
import {
  buildShareLink,
  DEFAULT_SETTINGS,
  isReviewMode,
  parseSavedState,
  parseShareParams,
  shareParamsFromUrl,
  STATE_VERSION,
} from '../../src/lib/storage';
import { DEFAULT_CYCLE_DAYS, parseIsoDate } from '../../src/lib/gestation';

/** Build a local-midnight Date from `YYYY-MM-DD`; throws on a bad literal. */
function date(iso: string): Date {
  const parsed = parseIsoDate(iso);
  if (!parsed) throw new Error(`bad test date: ${iso}`);
  return parsed;
}

describe('parseSavedState', () => {
  const valid = JSON.stringify({
    version: STATE_VERSION,
    method: 'lmp',
    inputDate: '2026-03-29',
    cycleLength: 31,
    settings: { units: 'metric', laborPanelEnabled: false, skin: 'cardinal' },
  });

  it('reads a well-formed record', () => {
    expect(parseSavedState(valid)).toEqual({
      version: STATE_VERSION,
      method: 'lmp',
      inputDate: '2026-03-29',
      cycleLength: 31,
      settings: { units: 'metric', laborPanelEnabled: false, skin: 'cardinal' },
    });
  });

  it('upgrades a v1 record to a 28-day cycle, leaving its due date unmoved', () => {
    const v1 = JSON.stringify({
      version: 1,
      method: 'lmp',
      inputDate: '2026-03-29',
      settings: { units: 'metric', laborPanelEnabled: false, skin: 'cardinal' },
    });
    expect(parseSavedState(v1)).toEqual({
      version: STATE_VERSION,
      method: 'lmp',
      inputDate: '2026-03-29',
      cycleLength: DEFAULT_CYCLE_DAYS,
      settings: { units: 'metric', laborPanelEnabled: false, skin: 'cardinal' },
    });
  });

  it('clamps a stored cycle length that is out of range', () => {
    const json = JSON.stringify({
      version: STATE_VERSION,
      method: 'lmp',
      inputDate: '2026-03-29',
      cycleLength: 400,
    });
    expect(parseSavedState(json)?.cycleLength).toBe(45);
  });

  it('fills in defaults for missing settings', () => {
    const json = JSON.stringify({ version: 1, method: 'dueDate', inputDate: '2027-01-03' });
    expect(parseSavedState(json)?.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back on an unknown skin rather than dropping the date', () => {
    const json = JSON.stringify({
      version: 1,
      method: 'lmp',
      inputDate: '2026-03-29',
      settings: { skin: 'pelican' },
    });
    expect(parseSavedState(json)?.settings.skin).toBe(DEFAULT_SETTINGS.skin);
  });

  it.each([
    ['null input', null],
    ['not json', '{'],
    ['not an object', '42'],
    [
      'a future version',
      JSON.stringify({ version: 99, method: 'lmp', inputDate: '2026-03-29' }),
    ],
    [
      'an unknown method',
      JSON.stringify({ version: 1, method: 'scan', inputDate: '2026-03-29' }),
    ],
    [
      'a malformed date',
      JSON.stringify({ version: 1, method: 'lmp', inputDate: '29-03-2026' }),
    ],
    [
      'a calendar-invalid date',
      JSON.stringify({ version: 1, method: 'lmp', inputDate: '2026-02-30' }),
    ],
    ['a missing date', JSON.stringify({ version: 1, method: 'lmp' })],
  ])('returns null for %s', (_name, json) => {
    expect(parseSavedState(json)).toBeNull();
  });
});

describe('share links', () => {
  it('parses a query string', () => {
    expect(parseShareParams('?m=lmp&d=2026-03-29')).toEqual({
      method: 'lmp',
      inputDate: '2026-03-29',
    });
  });

  it('parses a query string with no leading question mark', () => {
    expect(parseShareParams('m=conception&d=2026-04-12')).toEqual({
      method: 'conception',
      inputDate: '2026-04-12',
    });
  });

  it.each(['?m=lmp', '?d=2026-03-29', '?m=scan&d=2026-03-29', '?m=lmp&d=nope', ''])(
    'rejects %o',
    (search) => {
      expect(parseShareParams(search)).toBeNull();
    },
  );

  it('finds params in the search part of a full URL', () => {
    expect(shareParamsFromUrl('https://x.dev/nestling/?m=lmp&d=2026-03-29#/')).toEqual({
      method: 'lmp',
      inputDate: '2026-03-29',
    });
  });

  it('finds params after the hash', () => {
    expect(
      shareParamsFromUrl('https://x.dev/nestling/#/setup?m=dueDate&d=2027-01-03'),
    ).toEqual({
      method: 'dueDate',
      inputDate: '2027-01-03',
    });
  });

  it('returns null when there are no params', () => {
    expect(shareParamsFromUrl('https://x.dev/nestling/#/timeline')).toBeNull();
    expect(shareParamsFromUrl('https://x.dev/nestling/')).toBeNull();
  });

  it('always shares the derived due date, whatever the sender counts from', () => {
    // A shared ?m=lmp link would be ambiguous once cycle length exists: the
    // recipient would apply their own cycle to the sender's period date.
    expect(
      buildShareLink('https://x.dev/nestling/#/week/23', {
        method: 'lmp',
        inputDate: date('2026-03-29'),
        cycleLength: 28,
      }),
    ).toBe('https://x.dev/nestling/?m=dueDate&d=2027-01-03');
  });

  it('carries the cycle correction into the shared due date', () => {
    expect(
      buildShareLink('https://x.dev/nestling/', {
        method: 'lmp',
        inputDate: date('2026-03-29'),
        cycleLength: 35,
      }),
    ).toBe('https://x.dev/nestling/?m=dueDate&d=2027-01-10');
  });

  it('drops any existing hash or query on the origin', () => {
    expect(
      buildShareLink('https://x.dev/nestling/?m=old&d=2020-01-01', {
        method: 'dueDate',
        inputDate: date('2027-01-03'),
        cycleLength: 28,
      }),
    ).toBe('https://x.dev/nestling/?m=dueDate&d=2027-01-03');
  });

  it('round-trips a built link', () => {
    const link = buildShareLink('https://x.dev/nestling/', {
      method: 'conception',
      inputDate: date('2026-04-12'),
      cycleLength: 28,
    });
    expect(shareParamsFromUrl(link)).toEqual({
      method: 'dueDate',
      inputDate: '2027-01-03',
    });
  });
});

describe('isReviewMode', () => {
  it('is always on in dev', () => {
    expect(isReviewMode('https://x.dev/', true)).toBe(true);
  });

  it('is on in production only with ?review=1', () => {
    expect(isReviewMode('https://x.dev/?review=1', false)).toBe(true);
    expect(isReviewMode('https://x.dev/?a=b&review=1', false)).toBe(true);
    expect(isReviewMode('https://x.dev/?review=1&a=b', false)).toBe(true);
    expect(isReviewMode('https://x.dev/', false)).toBe(false);
    expect(isReviewMode('https://x.dev/?review=0', false)).toBe(false);
    expect(isReviewMode('https://x.dev/?preview=1', false)).toBe(false);
  });
});
