/**
 * ADR-002: due date and gestational-age math.
 *
 * Every function here is pure. `today` is always a parameter; this module never
 * calls `new Date()`. All arithmetic runs on local calendar days via date-fns
 * (`differenceInCalendarDays` / `addDays`), never on millisecond deltas, so a
 * date range that crosses a DST boundary still counts whole days.
 */
import { addDays, differenceInCalendarDays, isValid, parseISO } from 'date-fns';

export const APP_NAME = 'Nestling';

/** Gestational length in days from LMP to the due date. */
export const GESTATION_DAYS = 280;
/** Days from conception to the due date (280 − 14). */
export const CONCEPTION_TO_DUE_DAYS = 266;
/** Days by which conception trails LMP on the gestational-age scale. */
export const LMP_TO_CONCEPTION_DAYS = 14;

/**
 * Cycle length, in days, and the value Naegele's rule assumes.
 *
 * Naegele's rule adds 280 days to the first day of the last period, which is
 * only right for a 28-day cycle. Ovulation sits about 14 days before the *next*
 * period rather than 14 days after the last one, so a longer cycle means a later
 * conception and a later due date. The adjusted rule is
 *
 *     EDD = LMP + 280 + (cycleLength − 28)
 *
 * A 35-day cycle moves the due date a week later; a 24-day cycle moves it four
 * days earlier. Cycle length is not the same thing as period duration: how many
 * days the bleeding lasts does not shift the due date at all, because the count
 * starts on its first day either way.
 *
 * This correction applies to `lmp` only. In `conception` and `dueDate` mode the
 * user has already told us something downstream of ovulation, so there is
 * nothing left to correct.
 */
export const DEFAULT_CYCLE_DAYS = 28;
export const MIN_CYCLE_DAYS = 21;
export const MAX_CYCLE_DAYS = 45;

/** Clamp a cycle length into the range the Setup control offers. */
export function clampCycleLength(cycleLength: number): number {
  if (!Number.isFinite(cycleLength)) return DEFAULT_CYCLE_DAYS;
  return clamp(Math.round(cycleLength), MIN_CYCLE_DAYS, MAX_CYCLE_DAYS);
}

/** Days the due date moves relative to plain Naegele. Zero on a 28-day cycle. */
export function cycleShift(cycleLength: number): number {
  return clampCycleLength(cycleLength) - DEFAULT_CYCLE_DAYS;
}

/** The first and last week that carry a comparison row. */
export const FIRST_COMPARISON_WEEK = 2;
export const LAST_COMPARISON_WEEK = 42;

/** Length convention changes between these two weeks (ADR-002). */
export const CONVENTION_SWITCH_BEFORE_WEEK = 20;
export const CONVENTION_SWITCH_AFTER_WEEK = 21;

export type DatingMethod = 'lmp' | 'conception' | 'dueDate';

export const DATING_METHODS: readonly DatingMethod[] = ['lmp', 'conception', 'dueDate'];

export function isDatingMethod(value: unknown): value is DatingMethod {
  return typeof value === 'string' && (DATING_METHODS as readonly string[]).includes(value);
}

/** A calendar date with no time component, as `YYYY-MM-DD`. */
export type IsoDate = string;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse `YYYY-MM-DD` into a local-midnight Date. `parseISO` on a date-only
 * string yields local midnight, which is what every comparison here assumes.
 * Returns null rather than an Invalid Date so callers must handle bad input.
 */
export function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE.test(value)) return null;
  const parsed = parseISO(value);
  if (!isValid(parsed)) return null;
  // Reject calendar-invalid dates that parseISO rolls over (e.g. 2026-02-30).
  if (formatIsoDate(parsed) !== value) return null;
  return parsed;
}

/** Format a Date as `YYYY-MM-DD` using its local calendar fields. */
export function formatIsoDate(date: Date): IsoDate {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole local calendar days from `from` to `to`. DST-safe. */
export function daysBetween(from: Date, to: Date): number {
  return differenceInCalendarDays(to, from);
}

/**
 * Everything needed to place a pregnancy on the calendar: what the user chose
 * to count from, the date they gave, and their cycle length.
 *
 * This is one object rather than three positional arguments so that adding
 * `cycleLength` breaks every call site at compile time. A defaulted trailing
 * parameter would have let a screen quietly keep computing 28-day due dates.
 */
export interface Dating {
  readonly method: DatingMethod;
  readonly inputDate: Date;
  /** Typical cycle length in days. Ignored unless `method` is `lmp`. */
  readonly cycleLength: number;
}

/**
 * Reduce a dating to `lmpEquivalent`: the date that is day 0 of gestational
 * age. Table in ADR-002, as amended for cycle length.
 *
 * The cycle correction is applied here, at the single point where a user's
 * input becomes the gestational scale, so that every downstream value — due
 * date, gestational days, trimester, the comparison week, the labor model —
 * inherits it without knowing it exists.
 */
export function toLmpEquivalent({ method, inputDate, cycleLength }: Dating): Date {
  switch (method) {
    case 'lmp':
      return addDays(inputDate, cycleShift(cycleLength));
    case 'conception':
      return addDays(inputDate, -LMP_TO_CONCEPTION_DAYS);
    case 'dueDate':
      return addDays(inputDate, -GESTATION_DAYS);
  }
}

/**
 * Convert a stored date from one dating method to another, preserving the
 * pregnancy. Switching away from `lmp` folds the cycle correction into the new
 * date; switching back to `lmp` unfolds it, so a round trip is lossless.
 */
export function convertInputDate(
  from: DatingMethod,
  to: DatingMethod,
  inputDate: Date,
  cycleLength: number,
): Date {
  const lmpEquivalent = toLmpEquivalent({ method: from, inputDate, cycleLength });
  switch (to) {
    case 'lmp':
      return addDays(lmpEquivalent, -cycleShift(cycleLength));
    case 'conception':
      return addDays(lmpEquivalent, LMP_TO_CONCEPTION_DAYS);
    case 'dueDate':
      return addDays(lmpEquivalent, GESTATION_DAYS);
  }
}

export function dueDateFrom(lmpEquivalent: Date): Date {
  return addDays(lmpEquivalent, GESTATION_DAYS);
}

export type Trimester = 1 | 2 | 3;

/**
 * Trimester boundaries (ADR-002): 1st through 13w6d, 2nd 14w0d–27w6d,
 * 3rd from 28w0d. Before day 0 there is no trimester.
 */
export function trimesterFor(gestationalDays: number): Trimester | null {
  if (gestationalDays < 0) return null;
  if (gestationalDays < 14 * 7) return 1;
  if (gestationalDays < 28 * 7) return 2;
  return 3;
}

/**
 * Which state the Today screen is in. Mirrors the edge-state list in ADR-002
 * and the state table in the mockups.
 */
export type ProgressStatus =
  /** gestationalDays < 0 — the entered date is in the future on the LMP scale. */
  | 'invalid'
  /** 0 ≤ gestationalDays < 14 — before conception; no comparison row exists. */
  | 'tooEarly'
  /** A comparison row applies. */
  | 'normal'
  /** weeks > 42 — clamped to the Osprey row. */
  | 'pastTerm';

export interface Progress {
  /** Day 0 of gestational age. */
  readonly lmpEquivalent: Date;
  readonly dueDate: Date;
  /** Local calendar days from `lmpEquivalent` to `today`. May be negative. */
  readonly gestationalDays: number;
  /** Completed weeks. Floor of `gestationalDays / 7`; negative when invalid. */
  readonly weeks: number;
  /** Days into the current week, 0–6. */
  readonly days: number;
  /** `280 − gestationalDays`. Negative once past the due date. */
  readonly daysUntilDue: number;
  /** The comparison row to show: `clamp(weeks, 2, 42)`, or null when too early/invalid. */
  readonly comparisonWeek: number | null;
  readonly trimester: Trimester | null;
  readonly status: ProgressStatus;
  /** Fraction of the 280-day span elapsed, clamped to 0–1, for the progress bar. */
  readonly progressFraction: number;
}

/**
 * Everything the UI needs, derived from one date and one method plus today.
 * `today` is a Date whose local calendar fields are the user's current day.
 */
export function computeProgress(dating: Dating, today: Date): Progress {
  const lmpEquivalent = toLmpEquivalent(dating);
  const dueDate = dueDateFrom(lmpEquivalent);
  const gestationalDays = daysBetween(lmpEquivalent, today);
  const daysUntilDue = GESTATION_DAYS - gestationalDays;

  // Floor toward negative infinity so a negative day count reports negative weeks
  // rather than rounding toward zero.
  const weeks = Math.floor(gestationalDays / 7);
  const days = ((gestationalDays % 7) + 7) % 7;

  let status: ProgressStatus;
  if (gestationalDays < 0) status = 'invalid';
  else if (gestationalDays < LMP_TO_CONCEPTION_DAYS) status = 'tooEarly';
  else if (weeks > LAST_COMPARISON_WEEK) status = 'pastTerm';
  else status = 'normal';

  const comparisonWeek =
    status === 'invalid' || status === 'tooEarly'
      ? null
      : clamp(weeks, FIRST_COMPARISON_WEEK, LAST_COMPARISON_WEEK);

  return {
    lmpEquivalent,
    dueDate,
    gestationalDays,
    weeks,
    days,
    daysUntilDue,
    comparisonWeek,
    trimester: trimesterFor(gestationalDays),
    status,
    progressFraction: clamp(gestationalDays / GESTATION_DAYS, 0, 1),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** "23 weeks, 0 days". Past 42 weeks the header reads "42+ weeks" (mockup state table). */
export function formatWeeksAndDays(progress: Progress): string {
  if (progress.status === 'pastTerm') return '42+ weeks';
  const { weeks, days } = progress;
  const w = `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  const d = `${days} ${days === 1 ? 'day' : 'days'}`;
  return `${w}, ${d}`;
}

/** "119 days to go", or "1 day over" once past the due date. */
export function formatDaysRemaining(progress: Progress): string {
  const n = progress.daysUntilDue;
  if (n > 0) return `${n} ${n === 1 ? 'day' : 'days'} to go`;
  if (n === 0) return 'due today';
  const over = -n;
  return `${over} ${over === 1 ? 'day' : 'days'} over`;
}

export const TRIMESTER_LABEL: Record<Trimester, string> = {
  1: 'First trimester',
  2: 'Second trimester',
  3: 'Third trimester',
};

/**
 * Setup validation (mockup 1): empty input, dates over 300 days ago, and
 * future dates all block the button — except in due-date mode, where a future
 * date is the normal case.
 */
export const MAX_DAYS_IN_PAST = 300;

export type ValidationError =
  | { readonly kind: 'empty' }
  | { readonly kind: 'malformed' }
  | { readonly kind: 'future' }
  | { readonly kind: 'tooLongAgo' }
  | { readonly kind: 'dueTooFar' };

export function validateInput(
  method: DatingMethod,
  rawDate: string,
  today: Date,
): ValidationError | null {
  if (rawDate.trim() === '') return { kind: 'empty' };
  const parsed = parseIsoDate(rawDate);
  if (!parsed) return { kind: 'malformed' };

  const age = daysBetween(parsed, today);

  if (method === 'dueDate') {
    // A due date may sit in the future; it may not imply a pregnancy that has
    // not started (more than 280 days out) or one already 20 days past term.
    if (-age > GESTATION_DAYS) return { kind: 'dueTooFar' };
    if (age > MAX_DAYS_IN_PAST) return { kind: 'tooLongAgo' };
    return null;
  }

  if (age < 0) return { kind: 'future' };
  if (age > MAX_DAYS_IN_PAST) return { kind: 'tooLongAgo' };
  return null;
}

export const VALIDATION_MESSAGE: Record<ValidationError['kind'], string> = {
  empty: 'Enter a date.',
  malformed: 'Enter a date as year, month, day.',
  future: 'That date is in the future.',
  tooLongAgo: 'That date is more than 300 days ago.',
  dueTooFar: 'That due date is more than 280 days away.',
};

/** True on the two weeks that straddle the crown-rump → crown-heel switch. */
export function isConventionSwitchWeek(week: number): boolean {
  return week === CONVENTION_SWITCH_BEFORE_WEEK || week === CONVENTION_SWITCH_AFTER_WEEK;
}
