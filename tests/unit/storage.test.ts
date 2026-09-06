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

describe('parseSavedState', () => {
  const valid = JSON.stringify({
    version: STATE_VERSION,
    method: 'lmp',
    inputDate: '2026-03-29',
    settings: { units: 'metric', laborPanelEnabled: false, skin: 'cardinal' },
  });

  it('reads a well-formed record', () => {
    expect(parseSavedState(valid)).toEqual({
      version: STATE_VERSION,
      method: 'lmp',
      inputDate: '2026-03-29',
      settings: { units: 'metric', laborPanelEnabled: false, skin: 'cardinal' },
    });
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
      JSON.stringify({ version: 2, method: 'lmp', inputDate: '2026-03-29' }),
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

  it('builds a link that drops any existing hash or query', () => {
    expect(buildShareLink('https://x.dev/nestling/#/week/23', 'lmp', '2026-03-29')).toBe(
      'https://x.dev/nestling/?m=lmp&d=2026-03-29',
    );
    expect(
      buildShareLink('https://x.dev/nestling/?m=old&d=2020-01-01', 'dueDate', '2027-01-03'),
    ).toBe('https://x.dev/nestling/?m=dueDate&d=2027-01-03');
  });

  it('round-trips a built link', () => {
    const link = buildShareLink('https://x.dev/nestling/', 'conception', '2026-04-12');
    expect(shareParamsFromUrl(link)).toEqual({
      method: 'conception',
      inputDate: '2026-04-12',
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
