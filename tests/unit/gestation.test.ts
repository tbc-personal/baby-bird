import { describe, expect, it } from 'vitest';
import {
  clampCycleLength,
  computeProgress,
  convertInputDate,
  cycleShift,
  daysBetween,
  DEFAULT_CYCLE_DAYS,
  dueDateFrom,
  formatDaysRemaining,
  formatIsoDate,
  formatWeeksAndDays,
  isConventionSwitchWeek,
  isDatingMethod,
  parseIsoDate,
  formatWeekOffset,
  MAX_CYCLE_DAYS,
  MIN_CYCLE_DAYS,
  weekDateRange,
  toLmpEquivalent,
  trimesterFor,
  validateInput,
  VALIDATION_MESSAGE,
  type Dating,
  type DatingMethod,
  type ProgressStatus,
} from '../../src/lib/gestation';

/** Build a local-midnight Date from `YYYY-MM-DD`; throws on a bad literal. */
function d(iso: string): Date {
  const parsed = parseIsoDate(iso);
  if (!parsed) throw new Error(`bad test date: ${iso}`);
  return parsed;
}

/**
 * A dating with the 28-day cycle Naegele's rule assumes, which is what every
 * case predating the cycle-length field expects.
 */
function dating(
  method: DatingMethod,
  inputDate: Date,
  cycleLength: number = DEFAULT_CYCLE_DAYS,
): Dating {
  return { method, inputDate, cycleLength };
}

describe('parseIsoDate / formatIsoDate', () => {
  it('round-trips a plain date at local midnight', () => {
    const parsed = d('2026-03-29');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(29);
    expect(parsed.getHours()).toBe(0);
    expect(formatIsoDate(parsed)).toBe('2026-03-29');
  });

  it.each(['', '2026-3-29', '29-03-2026', '2026-02-30', '2026-13-01', 'not a date'])(
    'rejects %o',
    (bad) => {
      expect(parseIsoDate(bad)).toBeNull();
    },
  );

  it('accepts a leap day and rejects the same day in a common year', () => {
    expect(parseIsoDate('2028-02-29')).not.toBeNull();
    expect(parseIsoDate('2026-02-29')).toBeNull();
  });
});

describe('daysBetween across a DST boundary', () => {
  // US DST in 2026: spring forward Sunday 2026-03-08, fall back 2026-11-01.
  // A millisecond-based count would give 0.958… and 1.041… days here, which
  // floors to 0 and 1 respectively. Calendar-day counting gives 1 for both.
  it('counts one day across spring-forward', () => {
    expect(daysBetween(d('2026-03-07'), d('2026-03-08'))).toBe(1);
  });

  it('counts one day across fall-back', () => {
    expect(daysBetween(d('2026-10-31'), d('2026-11-01'))).toBe(1);
  });

  it('counts a whole span that contains spring-forward', () => {
    expect(daysBetween(d('2026-03-01'), d('2026-03-29'))).toBe(28);
  });

  it('is negative when `to` precedes `from`', () => {
    expect(daysBetween(d('2026-03-08'), d('2026-03-07'))).toBe(-1);
  });
});

describe('toLmpEquivalent and dueDateFrom (ADR-002 table)', () => {
  const table: ReadonlyArray<{
    method: DatingMethod;
    input: string;
    lmpEquivalent: string;
    due: string;
  }> = [
    { method: 'lmp', input: '2026-03-29', lmpEquivalent: '2026-03-29', due: '2027-01-03' },
    {
      method: 'conception',
      input: '2026-04-12',
      lmpEquivalent: '2026-03-29',
      due: '2027-01-03',
    },
    {
      method: 'dueDate',
      input: '2027-01-03',
      lmpEquivalent: '2026-03-29',
      due: '2027-01-03',
    },
  ];

  it.each(table)('$method $input', ({ method, input, lmpEquivalent, due }) => {
    const eq = toLmpEquivalent(dating(method, d(input)));
    expect(formatIsoDate(eq)).toBe(lmpEquivalent);
    expect(formatIsoDate(dueDateFrom(eq))).toBe(due);
  });

  it('conception + 266 days equals the due date', () => {
    expect(
      formatIsoDate(dueDateFrom(toLmpEquivalent(dating('conception', d('2026-04-12'))))),
    ).toBe(formatIsoDate(d('2027-01-03')));
  });
});

describe('convertInputDate', () => {
  const methods: DatingMethod[] = ['lmp', 'conception', 'dueDate'];

  it.each(methods)('round-trips through every other method from %s', (from) => {
    const original = d('2026-03-29');
    for (const to of methods) {
      const converted = convertInputDate(from, to, original, DEFAULT_CYCLE_DAYS);
      expect(formatIsoDate(convertInputDate(to, from, converted, DEFAULT_CYCLE_DAYS))).toBe(
        formatIsoDate(original),
      );
    }
  });

  it('lmp 2026-03-29 becomes conception 2026-04-12', () => {
    expect(
      formatIsoDate(
        convertInputDate('lmp', 'conception', d('2026-03-29'), DEFAULT_CYCLE_DAYS),
      ),
    ).toBe('2026-04-12');
  });

  it('lmp 2026-03-29 becomes due date 2027-01-03', () => {
    expect(
      formatIsoDate(
        convertInputDate('lmp', 'dueDate', d('2026-03-29'), DEFAULT_CYCLE_DAYS),
      ),
    ).toBe('2027-01-03');
  });
});

describe('trimesterFor', () => {
  const table: ReadonlyArray<[number, 1 | 2 | 3 | null]> = [
    [-1, null],
    [0, 1],
    [13 * 7 + 6, 1], // 13w6d
    [14 * 7, 2], // 14w0d
    [27 * 7 + 6, 2], // 27w6d
    [28 * 7, 3], // 28w0d
    [300, 3],
  ];
  it.each(table)('day %i is trimester %s', (days, expected) => {
    expect(trimesterFor(days)).toBe(expected);
  });
});

describe('computeProgress edge states (ADR-002)', () => {
  const table: ReadonlyArray<{
    name: string;
    method: DatingMethod;
    input: string;
    today: string;
    gestationalDays: number;
    weeks: number;
    days: number;
    status: ProgressStatus;
    comparisonWeek: number | null;
    daysUntilDue: number;
  }> = [
    {
      name: 'the mockup example: LMP 2026-03-29 viewed 2026-09-06',
      method: 'lmp',
      input: '2026-03-29',
      today: '2026-09-06',
      gestationalDays: 161,
      weeks: 23,
      days: 0,
      status: 'normal',
      comparisonWeek: 23,
      daysUntilDue: 119,
    },
    {
      name: 'gestationalDays < 0 is invalid',
      method: 'lmp',
      input: '2026-09-10',
      today: '2026-09-06',
      gestationalDays: -4,
      weeks: -1,
      days: 3,
      status: 'invalid',
      comparisonWeek: null,
      daysUntilDue: 284,
    },
    {
      name: 'day 0 is too early',
      method: 'lmp',
      input: '2026-09-06',
      today: '2026-09-06',
      gestationalDays: 0,
      weeks: 0,
      days: 0,
      status: 'tooEarly',
      comparisonWeek: null,
      daysUntilDue: 280,
    },
    {
      name: 'day 13 is the last too-early day',
      method: 'lmp',
      input: '2026-03-29',
      today: '2026-04-11',
      gestationalDays: 13,
      weeks: 1,
      days: 6,
      status: 'tooEarly',
      comparisonWeek: null,
      daysUntilDue: 267,
    },
    {
      name: 'day 14 is the first comparison day, week 2',
      method: 'lmp',
      input: '2026-03-29',
      today: '2026-04-12',
      gestationalDays: 14,
      weeks: 2,
      days: 0,
      status: 'normal',
      comparisonWeek: 2,
      daysUntilDue: 266,
    },
    {
      name: 'week 3 has a proposed row and renders normally',
      method: 'lmp',
      input: '2026-03-29',
      today: '2026-04-19',
      gestationalDays: 21,
      weeks: 3,
      days: 0,
      status: 'normal',
      comparisonWeek: 3,
      daysUntilDue: 259,
    },
    {
      name: 'week 20, the last crown-rump week',
      method: 'lmp',
      input: '2026-03-29',
      today: '2026-08-16',
      gestationalDays: 140,
      weeks: 20,
      days: 0,
      status: 'normal',
      comparisonWeek: 20,
      daysUntilDue: 140,
    },
    {
      name: 'week 21, the first crown-heel week',
      method: 'lmp',
      input: '2026-03-29',
      today: '2026-08-23',
      gestationalDays: 147,
      weeks: 21,
      days: 0,
      status: 'normal',
      comparisonWeek: 21,
      daysUntilDue: 133,
    },
    {
      name: 'the due date itself is 40w0d',
      method: 'lmp',
      input: '2026-03-29',
      today: '2027-01-03',
      gestationalDays: 280,
      weeks: 40,
      days: 0,
      status: 'normal',
      comparisonWeek: 40,
      daysUntilDue: 0,
    },
    {
      name: '43w0d clamps to the Osprey row and reads past term',
      method: 'lmp',
      input: '2026-03-29',
      today: '2027-01-24',
      gestationalDays: 301,
      weeks: 43,
      days: 0,
      status: 'pastTerm',
      comparisonWeek: 42,
      daysUntilDue: -21,
    },
    {
      name: '42w6d is the last normal day',
      method: 'lmp',
      input: '2026-03-29',
      today: '2027-01-23',
      gestationalDays: 300,
      weeks: 42,
      days: 6,
      status: 'normal',
      comparisonWeek: 42,
      daysUntilDue: -20,
    },
    {
      name: '42w0d still reads as week 42',
      method: 'lmp',
      input: '2026-03-29',
      today: '2027-01-17',
      gestationalDays: 294,
      weeks: 42,
      days: 0,
      status: 'normal',
      comparisonWeek: 42,
      daysUntilDue: -14,
    },
    {
      name: 'a span that crosses US spring-forward counts calendar days',
      method: 'lmp',
      input: '2026-02-15',
      today: '2026-03-29',
      gestationalDays: 42,
      weeks: 6,
      days: 0,
      status: 'normal',
      comparisonWeek: 6,
      daysUntilDue: 238,
    },
    {
      name: 'a span that crosses US fall-back counts calendar days',
      method: 'lmp',
      input: '2026-10-05',
      today: '2026-11-16',
      gestationalDays: 42,
      weeks: 6,
      days: 0,
      status: 'normal',
      comparisonWeek: 6,
      daysUntilDue: 238,
    },
    {
      name: 'due-date mode derives the same progress',
      method: 'dueDate',
      input: '2027-01-03',
      today: '2026-09-06',
      gestationalDays: 161,
      weeks: 23,
      days: 0,
      status: 'normal',
      comparisonWeek: 23,
      daysUntilDue: 119,
    },
    {
      name: 'conception mode derives the same progress',
      method: 'conception',
      input: '2026-04-12',
      today: '2026-09-06',
      gestationalDays: 161,
      weeks: 23,
      days: 0,
      status: 'normal',
      comparisonWeek: 23,
      daysUntilDue: 119,
    },
  ];

  it.each(table)('$name', (row) => {
    const p = computeProgress(dating(row.method, d(row.input)), d(row.today));
    expect(p.gestationalDays).toBe(row.gestationalDays);
    expect(p.weeks).toBe(row.weeks);
    expect(p.days).toBe(row.days);
    expect(p.status).toBe(row.status);
    expect(p.comparisonWeek).toBe(row.comparisonWeek);
    expect(p.daysUntilDue).toBe(row.daysUntilDue);
  });

  it('progressFraction is clamped to 0–1', () => {
    const early = computeProgress(dating('lmp', d('2026-09-10')), d('2026-09-06'));
    expect(early.progressFraction).toBe(0);
    const late = computeProgress(dating('lmp', d('2026-03-29')), d('2027-06-01'));
    expect(late.progressFraction).toBe(1);
    const mid = computeProgress(dating('lmp', d('2026-03-29')), d('2026-09-06'));
    expect(mid.progressFraction).toBeCloseTo(161 / 280, 10);
  });

  it('the whole 280-day span steps one day at a time with no gaps', () => {
    // Walks every day of a pregnancy that contains both DST transitions.
    let previous = -1;
    for (let i = 0; i <= 300; i += 1) {
      const today = new Date(2026, 2, 29 + i);
      const p = computeProgress(dating('lmp', d('2026-03-29')), today);
      expect(p.gestationalDays).toBe(previous + 1);
      expect(p.weeks * 7 + p.days).toBe(p.gestationalDays);
      previous = p.gestationalDays;
    }
  });
});

describe('formatting', () => {
  it('formats weeks and days with correct singulars', () => {
    const p = (input: string, today: string) =>
      computeProgress(dating('lmp', d(input)), d(today));
    expect(formatWeeksAndDays(p('2026-03-29', '2026-09-06'))).toBe('23 weeks, 0 days');
    expect(formatWeeksAndDays(p('2026-03-29', '2026-09-07'))).toBe('23 weeks, 1 day');
    expect(formatWeeksAndDays(p('2026-03-29', '2026-04-05'))).toBe('1 week, 0 days');
    expect(formatWeeksAndDays(p('2026-03-29', '2027-01-24'))).toBe('42+ weeks');
  });

  it('formats days remaining on both sides of the due date', () => {
    const p = (today: string) => computeProgress(dating('lmp', d('2026-03-29')), d(today));
    expect(formatDaysRemaining(p('2026-09-06'))).toBe('119 days to go');
    expect(formatDaysRemaining(p('2027-01-02'))).toBe('1 day to go');
    expect(formatDaysRemaining(p('2027-01-03'))).toBe('due today');
    expect(formatDaysRemaining(p('2027-01-04'))).toBe('1 day over');
    expect(formatDaysRemaining(p('2027-01-06'))).toBe('3 days over');
  });
});

describe('validateInput', () => {
  const today = d('2026-09-06');
  const table: ReadonlyArray<{
    method: DatingMethod;
    raw: string;
    expected: keyof typeof VALIDATION_MESSAGE | null;
  }> = [
    { method: 'lmp', raw: '', expected: 'empty' },
    { method: 'lmp', raw: '   ', expected: 'empty' },
    { method: 'lmp', raw: '2026-02-30', expected: 'malformed' },
    { method: 'lmp', raw: '2026-09-07', expected: 'future' },
    { method: 'lmp', raw: '2026-09-06', expected: null },
    { method: 'lmp', raw: '2025-11-10', expected: null }, // exactly 300 days ago
    { method: 'lmp', raw: '2025-11-09', expected: 'tooLongAgo' },
    { method: 'conception', raw: '2026-09-07', expected: 'future' },
    { method: 'dueDate', raw: '2027-06-13', expected: null }, // exactly 280 days out
    { method: 'dueDate', raw: '2027-06-14', expected: 'dueTooFar' },
    { method: 'dueDate', raw: '2026-09-06', expected: null },
    { method: 'dueDate', raw: '2025-11-09', expected: 'tooLongAgo' },
  ];

  it.each(table)('$method $raw', ({ method, raw, expected }) => {
    const result = validateInput(method, raw, today);
    expect(result === null ? null : result.kind).toBe(expected);
  });

  it('has a message for every error kind', () => {
    for (const kind of Object.keys(VALIDATION_MESSAGE)) {
      expect(VALIDATION_MESSAGE[kind as keyof typeof VALIDATION_MESSAGE]).toBeTruthy();
    }
  });
});

describe('misc guards', () => {
  it('recognizes dating methods', () => {
    expect(isDatingMethod('lmp')).toBe(true);
    expect(isDatingMethod('dueDate')).toBe(true);
    expect(isDatingMethod('ultrasound')).toBe(false);
    expect(isDatingMethod(3)).toBe(false);
  });

  it('flags the convention switch weeks', () => {
    expect(isConventionSwitchWeek(19)).toBe(false);
    expect(isConventionSwitchWeek(20)).toBe(true);
    expect(isConventionSwitchWeek(21)).toBe(true);
    expect(isConventionSwitchWeek(22)).toBe(false);
  });
});

describe('cycle length (adjusted Naegele)', () => {
  const lmp = '2026-03-29';

  it('a 28-day cycle is plain Naegele', () => {
    expect(cycleShift(28)).toBe(0);
    expect(formatIsoDate(dueDateFrom(toLmpEquivalent(dating('lmp', d(lmp), 28))))).toBe(
      '2027-01-03',
    );
  });

  it('a longer cycle moves the due date later, day for day', () => {
    expect(cycleShift(35)).toBe(7);
    expect(formatIsoDate(dueDateFrom(toLmpEquivalent(dating('lmp', d(lmp), 35))))).toBe(
      '2027-01-10',
    );
  });

  it('a shorter cycle moves the due date earlier', () => {
    expect(cycleShift(24)).toBe(-4);
    expect(formatIsoDate(dueDateFrom(toLmpEquivalent(dating('lmp', d(lmp), 24))))).toBe(
      '2026-12-30',
    );
  });

  it('shifts gestational age by the same amount', () => {
    const today = d('2026-09-06');
    const plain = computeProgress(dating('lmp', d(lmp), 28), today);
    const long = computeProgress(dating('lmp', d(lmp), 35), today);
    expect(plain.gestationalDays - long.gestationalDays).toBe(7);
  });

  it('does not apply to conception or due-date mode', () => {
    for (const method of ['conception', 'dueDate'] as const) {
      const at28 = toLmpEquivalent(dating(method, d('2026-04-12'), 28));
      const at35 = toLmpEquivalent(dating(method, d('2026-04-12'), 35));
      expect(formatIsoDate(at35)).toBe(formatIsoDate(at28));
    }
  });

  it('round-trips lmp through every other method at a non-default cycle', () => {
    const original = d(lmp);
    for (const to of ['lmp', 'conception', 'dueDate'] as const) {
      const converted = convertInputDate('lmp', to, original, 35);
      expect(formatIsoDate(convertInputDate(to, 'lmp', converted, 35))).toBe(
        formatIsoDate(original),
      );
    }
  });

  it('clamps out-of-range and non-finite values rather than throwing', () => {
    expect(clampCycleLength(10)).toBe(MIN_CYCLE_DAYS);
    expect(clampCycleLength(90)).toBe(MAX_CYCLE_DAYS);
    expect(clampCycleLength(30.4)).toBe(30);
    expect(clampCycleLength(Number.NaN)).toBe(DEFAULT_CYCLE_DAYS);
  });
});

describe('browsing other weeks', () => {
  it('spans the seven days of the gestational week', () => {
    const lmp = d('2026-03-29');
    // Week 23 begins on 23w0d, which is the day the header first reads 23 weeks.
    const week23 = weekDateRange(lmp, 23);
    expect(formatIsoDate(week23.start)).toBe('2026-09-06');
    expect(formatIsoDate(week23.end)).toBe('2026-09-12');

    const week24 = weekDateRange(lmp, 24);
    expect(formatIsoDate(week24.start)).toBe('2026-09-13');
    expect(daysBetween(week24.start, week24.end)).toBe(6);
  });

  it('picks up where the previous week left off, with no gap or overlap', () => {
    const lmp = d('2026-03-29');
    for (let week = 2; week < 42; week += 1) {
      const here = weekDateRange(lmp, week);
      const next = weekDateRange(lmp, week + 1);
      expect(daysBetween(here.end, next.start)).toBe(1);
    }
  });

  it('words the offset, and says nothing at all on the present week', () => {
    expect(formatWeekOffset(0)).toBeNull();
    expect(formatWeekOffset(1)).toBe('1 week ahead');
    expect(formatWeekOffset(6)).toBe('6 weeks ahead');
    expect(formatWeekOffset(-1)).toBe('1 week ago');
    expect(formatWeekOffset(-3)).toBe('3 weeks ago');
  });
});
