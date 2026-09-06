/**
 * Date display. Kept apart from `gestation.ts` so that module stays free of
 * anything locale-shaped. Formatting is fixed to en-US to match the mockups
 * ("January 3, 2027", "due Jan 3") rather than following the device locale,
 * which would make the screenshots in `tests/e2e` non-deterministic.
 */
import { format } from 'date-fns';

/** "January 3, 2027" — the Setup preview. */
export function formatLongDate(date: Date): string {
  return format(date, 'MMMM d, yyyy');
}

/** "Jan 3" — the Today header. */
export function formatShortDate(date: Date): string {
  return format(date, 'MMM d');
}

/** "2026-03-29" for the <input type="date"> value. */
export function formatInputDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
