import { hrefFor } from '../lib/router';
import { isReviewMode } from '../lib/storage';
import { weekRow } from '../data/comparisons';
import { ComparisonCard } from '../components/ComparisonCard';
import { useAppState } from '../useAppState';
import { BASE_URL, EmptyState } from './Today';

/**
 * `#/week/:n` renders the same card as Today for any week 2–42, so a timeline
 * row and a shared deep link land on identical content.
 */
export function WeekScreen({ week }: { week: number; today: Date }) {
  const { settings } = useAppState();
  const row = weekRow(week);
  const reviewMode = isReviewMode(window.location.href, import.meta.env.DEV);

  if (!row || row.comparison === null) {
    return (
      <>
        <EmptyState
          title={`No comparison for week ${week}`}
          body="The table runs from week 2 to week 42."
        />
        <p className="small">
          <a href={hrefFor({ name: 'timeline' })}>Back to the timeline</a>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="meta">
        <a href={hrefFor({ name: 'timeline' })}>← All weeks</a>
        <span className="mono">week {row.week}</span>
      </div>
      <ComparisonCard
        row={row}
        units={settings.units}
        reviewMode={reviewMode}
        base={BASE_URL}
      />
    </>
  );
}
