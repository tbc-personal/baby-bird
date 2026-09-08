import { describe, expect, it } from 'vitest';
import { formatDateRange } from '../../src/lib/dates';
import { parseIsoDate } from '../../src/lib/gestation';

function d(iso: string): Date {
  const parsed = parseIsoDate(iso);
  if (!parsed) throw new Error(`bad test date: ${iso}`);
  return parsed;
}

describe('formatDateRange', () => {
  it('names the month once when the span stays inside it', () => {
    expect(formatDateRange(d('2026-10-18'), d('2026-10-24'))).toBe('October 18–24');
  });

  it('names both months when the span crosses one', () => {
    expect(formatDateRange(d('2026-10-30'), d('2026-11-05'))).toBe(
      'October 30 – November 5',
    );
  });

  it('names both months across a year boundary', () => {
    expect(formatDateRange(d('2026-12-28'), d('2027-01-03'))).toBe(
      'December 28 – January 3',
    );
  });
});
