import {
  computeProgress,
  FIRST_COMPARISON_WEEK,
  formatDaysRemaining,
  formatWeekOffset,
  formatWeeksAndDays,
  LAST_COMPARISON_WEEK,
  parseIsoDate,
  TRIMESTER_LABEL,
  weekDateRange,
  type Progress,
} from '../lib/gestation';
import { formatDateRange, formatShortDate } from '../lib/dates';
import { hrefFor } from '../lib/router';
import { datingFrom, isReviewMode } from '../lib/storage';
import { weekRow } from '../data/comparisons';
import { ComparisonCard } from '../components/ComparisonCard';
import { LaborPanelCard } from '../components/LaborPanel';
import { LABOR_PANEL_FROM_DAY } from '../lib/laborProbability';
import { useAppState } from '../useAppState';
import './Today.css';

/** The app's base path, so a Commons image resolves under a project Pages URL. */
export const BASE_URL: string = import.meta.env.BASE_URL;

/**
 * Mockup 2. Header with trimester and due date, the big weeks-and-days line,
 * a progress bar, and a week's card — plus arrows to look ahead or back.
 *
 * The viewed week lives in the route, not in component state: `#/` is the week
 * you are actually in, and `#/week/:n` is any other week, rendered by this same
 * screen. That reverses the earlier decision to hold the offset in state. The
 * timeline has to navigate somewhere, and once it does, state and route are two
 * representations of one thing to keep in step. Routing it also gets the back
 * button working through a browse, and keeps a week deep-linkable.
 *
 * `#/week/:n` used to render a separate, thinner screen with no header and no
 * arrows, which is why tapping a timeline row felt like leaving the app.
 */
export function TodayScreen({ today, week }: { today: Date; week: number | null }) {
  const { saved, settings } = useAppState();
  if (!saved) return null;

  const inputDate = parseIsoDate(saved.inputDate);
  if (!inputDate) return null;

  const progress = computeProgress(datingFrom(saved, inputDate), today);
  const reviewMode = isReviewMode(window.location.href, import.meta.env.DEV);

  // A week outside the table, reached by editing the URL by hand. Clamping it
  // to 42 would silently show the wrong week, so say so instead — the same
  // empty state the separate week screen used to give.
  if (week !== null && (week < FIRST_COMPARISON_WEEK || week > LAST_COMPARISON_WEEK)) {
    return (
      <>
        <EmptyState
          title={`No comparison for week ${String(week)}`}
          body="The table runs from week 2 to week 42."
        />
        <p className="small">
          <a href={hrefFor({ name: 'timeline' })}>Back to the timeline</a>
        </p>
      </>
    );
  }

  const currentWeek = progress.comparisonWeek;
  const viewedWeek = week ?? currentWeek;

  // Browsing means looking at a week other than the one you are in. A routed
  // week that happens to be the current one is not browsing, so tapping your
  // own row in the timeline lands you back on the live reading rather than on
  // a "0 weeks ahead" version of it.
  const browsing = week !== null && week !== currentWeek;
  // The offset only means something when there is a current week to count
  // from. Before conception there is not, and the header omits the phrase.
  const offset =
    browsing && currentWeek !== null && viewedWeek !== null ? viewedWeek - currentWeek : 0;

  return (
    <>
      <ProgressHeader
        progress={progress}
        viewedWeek={viewedWeek}
        browsing={browsing}
        offset={offset}
      />

      {!browsing && progress.status === 'invalid' ? (
        <EmptyState
          title="That date has not arrived yet"
          body="Counting starts from the date you entered. Change it in Setup."
        />
      ) : !browsing && progress.status === 'tooEarly' ? (
        <EmptyState
          title="Too early for a comparison"
          body="Counting starts from your period date, so the first two weeks are before conception."
        />
      ) : (
        <WeekCard week={viewedWeek} units={settings.units} reviewMode={reviewMode} />
      )}

      {/*
        The labor panel is about now — the chance of labor in the next seven
        days — so it stays behind while you browse other weeks.
      */}
      {settings.laborPanelEnabled &&
      !browsing &&
      progress.gestationalDays >= LABOR_PANEL_FROM_DAY ? (
        <LaborPanelCard gestationalDays={progress.gestationalDays} />
      ) : null}
    </>
  );
}

export function ProgressHeader({
  progress,
  viewedWeek,
  browsing,
  offset,
}: {
  progress: Progress;
  viewedWeek: number | null;
  /** True when the viewed week is not the week you are actually in. */
  browsing: boolean;
  /**
   * Weeks from the present one. Zero while not browsing, and also zero when
   * there is no present week to count from, where the dates carry the meaning
   * on their own.
   */
  offset: number;
}) {
  const range =
    browsing && viewedWeek !== null ? weekDateRange(progress.lmpEquivalent, viewedWeek) : null;

  return (
    <>
      <div className="meta meta--pills">
        <span className="pill pill--trimester">
          {progress.trimester ? TRIMESTER_LABEL[progress.trimester] : 'Not started'}
        </span>
        <span className="pill pill--due mono">due {formatShortDate(progress.dueDate)}</span>
      </div>

      <div className="head">
        <Arrow direction="back" viewedWeek={viewedWeek} />
        <h1 className="big">
          {browsing ? `Week ${String(viewedWeek)}` : formatWeeksAndDays(progress)}{' '}
          <small>
            {browsing ? formatWeekOffset(offset) : formatDaysRemaining(progress)}
          </small>
        </h1>
        <Arrow direction="forward" viewedWeek={viewedWeek} />
      </div>

      {range ? (
        <p className="head__range small">
          {formatDateRange(range.start, range.end)}
          {' · '}
          <a href={hrefFor({ name: 'today' })}>back to this week</a>
        </p>
      ) : null}

      <div className="bar">
        <i style={{ width: `${(progress.progressFraction * 100).toFixed(1)}%` }} />
      </div>
      {progress.status === 'pastTerm' && !browsing ? (
        <p className="note">Past 42 weeks. The card stays on the last row.</p>
      ) : null}
    </>
  );
}

/**
 * One of the two header arrows. A link rather than a button, because it changes
 * the route: it should middle-click, long-press and keyboard like navigation,
 * which is what it now is.
 *
 * At either end of the range it renders as a span rather than vanishing, so the
 * heading does not jump sideways on week 2 or week 42 — the same treatment the
 * tab bar gives a tab you cannot reach yet.
 */
function Arrow({
  direction,
  viewedWeek,
}: {
  direction: 'back' | 'forward';
  viewedWeek: number | null;
}) {
  const back = direction === 'back';
  const label = back ? 'Previous week' : 'Next week';
  const glyph = back ? '\u2190' : '\u2192';
  const target = viewedWeek === null ? null : viewedWeek + (back ? -1 : 1);

  if (target === null || target < FIRST_COMPARISON_WEEK || target > LAST_COMPARISON_WEEK) {
    return (
      <span className="head__arrow" aria-disabled="true" aria-label={label}>
        {glyph}
      </span>
    );
  }
  return (
    <a className="head__arrow" href={hrefFor({ name: 'week', week: target })} aria-label={label}>
      {glyph}
    </a>
  );
}

export function WeekCard({
  week,
  units,
  reviewMode,
}: {
  week: number | null;
  units: 'imperial' | 'metric';
  reviewMode: boolean;
}) {
  const row = week === null ? null : weekRow(week);
  if (!row) {
    return (
      <EmptyState
        title="No comparison for this week"
        body="The table runs from week 2 to week 42."
      />
    );
  }
  return <ComparisonCard row={row} units={units} reviewMode={reviewMode} base={BASE_URL} />;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}
