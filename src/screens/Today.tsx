import { useState } from 'react';
import {
  computeProgress,
  formatDaysRemaining,
  formatWeeksAndDays,
  parseIsoDate,
  TRIMESTER_LABEL,
  type Progress,
} from '../lib/gestation';
import { formatShortDate } from '../lib/dates';
import { buildShareLink, isReviewMode } from '../lib/storage';
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
 * a progress bar, this week's card, and the share button.
 */
export function TodayScreen({ today }: { today: Date }) {
  const { saved, settings } = useAppState();
  if (!saved) return null;

  const inputDate = parseIsoDate(saved.inputDate);
  if (!inputDate) return null;

  const progress = computeProgress(saved.method, inputDate, today);
  const reviewMode = isReviewMode(window.location.href, import.meta.env.DEV);

  return (
    <>
      <ProgressHeader progress={progress} />

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
        <WeekCard
          week={progress.comparisonWeek}
          units={settings.units}
          reviewMode={reviewMode}
        />
      )}

      {settings.laborPanelEnabled && progress.gestationalDays >= LABOR_PANEL_FROM_DAY ? (
        <LaborPanelCard gestationalDays={progress.gestationalDays} />
      ) : null}

      <ShareButton method={saved.method} inputDate={saved.inputDate} />
    </>
  );
}

export function ProgressHeader({ progress }: { progress: Progress }) {
  return (
    <>
      <div className="meta">
        <span>
          {progress.trimester ? TRIMESTER_LABEL[progress.trimester] : 'Not started'}
        </span>
        <span className="mono">due {formatShortDate(progress.dueDate)}</span>
      </div>
      <h1 className="big">
        {formatWeeksAndDays(progress)} <small>· {formatDaysRemaining(progress)}</small>
      </h1>
      <div className="bar">
        <i style={{ width: `${(progress.progressFraction * 100).toFixed(1)}%` }} />
      </div>
      {progress.status === 'pastTerm' ? (
        <p className="note">Past 42 weeks. The card stays on the last row.</p>
      ) : null}
    </>
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

function ShareButton({ method, inputDate }: { method: string; inputDate: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="today__share">
      <button
        type="button"
        className="btn btn--quiet"
        onClick={() => {
          const link = buildShareLink(
            window.location.href,
            method as Parameters<typeof buildShareLink>[1],
            inputDate,
          );
          void copy(link).then((ok) => {
            setCopied(ok);
            window.setTimeout(() => {
              setCopied(false);
            }, 2500);
          });
        }}
      >
        Copy a shareable link
      </button>
      <p className="small" role="status">
        {copied ? 'Link copied.' : ' '}
      </p>
    </div>
  );
}

/**
 * `navigator.clipboard` needs a secure context and can be refused. The fallback
 * selects a temporary textarea, which works in every browser the app targets.
 */
async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(field);
      return ok;
    } catch {
      return false;
    }
  }
}
