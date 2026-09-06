/**
 * The typed view of `data/comparisons.json` (PLAN §2). The JSON is the single
 * source of truth; this module parses it through the shared zod schema once at
 * module load so a malformed file fails loudly in dev and in the build rather
 * than rendering `undefined` somewhere deep in a card.
 */
import raw from '../../data/comparisons.json';
import { comparisonsSchema, type WeekRow } from '../lib/schema';
import { FIRST_COMPARISON_WEEK, LAST_COMPARISON_WEEK } from '../lib/gestation';

const parsed = comparisonsSchema.parse(raw);

export const LENGTH_CONVENTION = parsed.lengthConvention;

/** Every row, week 1 first. Week 1 carries no comparison, by design. */
export const ALL_WEEKS: readonly WeekRow[] = [...parsed.weeks].sort(
  (a, b) => a.week - b.week,
);

/** Only the rows that have something to show: weeks 2–42. */
export const COMPARISON_WEEKS: readonly WeekRow[] = ALL_WEEKS.filter(
  (row) => row.week >= FIRST_COMPARISON_WEEK && row.week <= LAST_COMPARISON_WEEK,
);

const BY_WEEK = new Map(ALL_WEEKS.map((row) => [row.week, row]));

export function weekRow(week: number): WeekRow | null {
  return BY_WEEK.get(week) ?? null;
}

export type { WeekRow };
