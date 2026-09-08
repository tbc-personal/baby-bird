import { useState } from 'react';
import {
  clamp,
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
 * a progress bar, and this week's card — plus arrows to look ahead or back.
 *
 * Browsing is screen state, not a route: `#/week/:n` already exists for a
 * linkable week (it is what the timeline opens), and giving the same content
 * two addressable URLs would mean two things to keep in step. Stepping away
 * from the present week here is a glance, and it resets when you leave.
 */
export function TodayScreen({ today }: { today: Date }) {
  const { saved, settings } = useAppState();
  const [weekOffset, setWeekOffset] = useState(0);
  if (!saved) return null;

  const inputDate = parseIsoDate(saved.inputDate);
  if (!inputDate) return null;

  const progress = computeProgress(datingFrom(saved, inputDate), today);
  const reviewMode = isReviewMode(window.location.href, import.meta.env.DEV);

  // Only a week with a comparison row can be browsed; before conception and
  // past 42 weeks there is nothing on either side to step to.
  const currentWeek = progress.comparisonWeek;
  const viewedWeek =
    currentWeek === null
      ? null
      : clamp(currentWeek + weekOffset, FIRST_COMPARISON_WEEK, LAST_COMPARISON_WEEK);
  // Re-derive the offset from the clamped week rather than trusting the raw
  // state, so holding the arrow at either end cannot bank invisible steps.
  const actualOffset = viewedWeek === null || currentWeek === null ? 0 : viewedWeek - currentWeek;

  function step(by: number) {
    if (currentWeek === null) return;
    setWeekOffset(
      clamp(currentWeek + actualOffset + by, FIRST_COMPARISON_WEEK, LAST_COMPARISON_WEEK) -
        currentWeek,
    );
  }

  return (
    <>
      <ProgressHeader
        progress={progress}
        viewedWeek={viewedWeek}
        offset={actualOffset}
        onStep={currentWeek === null ? null : step}
        onReturn={() => {
          setWeekOffset(0);
        }}
      />

      {progress.status === 'invalid' ? (
        <EmptyState
          title="That date has not arrived yet"
          body="Counting starts from the date you entered. Change it in Setup."
        />
      ) : progress.status === 'tooEarly' ? (
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
      actualOffset === 0 &&
      progress.gestationalDays >= LABOR_PANEL_FROM_DAY ? (
        <LaborPanelCard gestationalDays={progress.gestationalDays} />
      ) : null}
    </>
  );
}

export function ProgressHeader({
  progress,
  viewedWeek,
  offset,
  onStep,
  onReturn,
}: {
  progress: Progress;
  viewedWeek: number | null;
  /** Weeks from the present one. Zero means you are looking at today. */
  offset: number;
  /** Null when there is no comparison week to step away from. */
  onStep: ((by: number) => void) | null;
  onReturn: () => void;
}) {
  const browsing = offset !== 0;
  const range =
    browsing && viewedWeek !== null
      ? weekDateRange(progress.lmpEquivalent, viewedWeek)
      : null;

  return (
    <>
      {/*
        Pills rather than plain grey text: the skins were barely visible on
        Today, because almost everything above the card is ink on the page
        ground. These two chips are the one place a tint costs nothing.
      */}
      <div className="meta meta--pills">
        <span className="pill pill--trimester">
          {progress.trimester ? TRIMESTER_LABEL[progress.trimester] : 'Not started'}
        </span>
        <span className="pill pill--due mono">
          due {formatShortDate(progress.dueDate)}
        </span>
      </div>

      <div className="head">
        <Arrow
          direction="back"
          onStep={onStep}
          disabled={viewedWeek !== null && viewedWeek <= FIRST_COMPARISON_WEEK}
        />
        <h1 className="big">
          {browsing ? `Week ${String(viewedWeek)}` : formatWeeksAndDays(progress)}{' '}
          <small>
            {'· '}
            {browsing ? formatWeekOffset(offset) : formatDaysRemaining(progress)}
          </small>
        </h1>
        <Arrow
          direction="forward"
          onStep={onStep}
          disabled={viewedWeek !== null && viewedWeek >= LAST_COMPARISON_WEEK}
        />
      </div>

      {range ? (
        <p className="head__range small">
          {formatDateRange(range.start, range.end)}
          {' · '}
          <button type="button" className="linkish" onClick={onReturn}>
            back to this week
          </button>
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

/** One of the two header arrows. Rendered disabled rather than hidden, so the header does not reflow at the ends of the range. */
function Arrow({
  direction,
  onStep,
  disabled,
}: {
  direction: 'back' | 'forward';
  onStep: ((by: number) => void) | null;
  disabled: boolean;
}) {
  const back = direction === 'back';
  return (
    <button
      type="button"
      className="head__arrow"
      aria-label={back ? 'Previous week' : 'Next week'}
      disabled={onStep === null || disabled}
      onClick={() => onStep?.(back ? -1 : 1)}
    >
      {back ? '\u2190' : '\u2192'}
    </button>
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
