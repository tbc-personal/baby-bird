import { useEffect, useMemo, useState } from 'react';
import {
  computeProgress,
  convertInputDate,
  formatIsoDate,
  formatWeeksAndDays,
  parseIsoDate,
  validateInput,
  VALIDATION_MESSAGE,
  type DatingMethod,
} from '../lib/gestation';
import { formatLongDate } from '../lib/dates';
import { hrefFor } from '../lib/router';
import type { SharedDate } from '../lib/storage';
import { useAppState } from '../useAppState';
import { navigate } from '../useRoute';
import { AppMark } from '../components/AppMark';
import { useDisclosure } from '../components/useDisclosure';
import '../components/InfoButton.css';
import './Setup.css';

const METHODS: ReadonlyArray<{
  id: DatingMethod;
  option: string;
  dateLabel: string;
  formula: string;
}> = [
  {
    id: 'lmp',
    option: 'Last menstrual period',
    dateLabel: 'Date of last period',
    formula: 'due = date + 280 d',
  },
  {
    id: 'conception',
    option: 'Conception date',
    dateLabel: 'Date of conception',
    formula: 'due = date + 266 d',
  },
  {
    id: 'dueDate',
    option: 'Enter my due date',
    dateLabel: 'Due date',
    formula: 'as given',
  },
];

function methodInfo(id: DatingMethod) {
  const found = METHODS.find((method) => method.id === id);
  if (!found) throw new Error(`unknown dating method: ${id}`);
  return found;
}

/**
 * Mockup 1. Three dating methods, one date, and a live preview of the due date
 * and current progress. There is no privacy copy on this screen; it lives in
 * About (ADR-006).
 */
export function SetupScreen({ today, shared }: { today: Date; shared: SharedDate | null }) {
  const { saved, save } = useAppState();

  const [method, setMethod] = useState<DatingMethod>(
    () => shared?.method ?? saved?.method ?? 'lmp',
  );
  const [rawDate, setRawDate] = useState<string>(
    () => shared?.inputDate ?? saved?.inputDate ?? '',
  );
  /**
   * A shared link that would overwrite an existing saved date asks first
   * (ADR-006). Declining restores what was already stored.
   */
  const [askingToReplace, setAskingToReplace] = useState(
    () => shared !== null && saved !== null && shared.inputDate !== saved.inputDate,
  );

  const error = validateInput(method, rawDate, today);
  const parsed = error ? null : parseIsoDate(rawDate);
  const progress = parsed ? computeProgress(method, parsed, today) : null;

  // Switching the method converts the date rather than clearing it, so the same
  // pregnancy stays selected (ADR-002 "Consequences").
  function changeMethod(next: DatingMethod) {
    const current = parseIsoDate(rawDate);
    setMethod(next);
    if (current) setRawDate(formatIsoDate(convertInputDate(method, next, current)));
  }

  const info = methodInfo(method);
  const methodHelp = useDisclosure();

  const derivedLine = useMemo(() => {
    if (!progress) return null;
    // In due-date mode the preview shows the derived period date instead of the
    // due date the user just typed (mockup 1, third note).
    return method === 'dueDate'
      ? {
          label: 'Counting from',
          value: formatLongDate(progress.lmpEquivalent),
        }
      : { label: 'Due date', value: formatLongDate(progress.dueDate) };
  }, [progress, method]);

  const canSubmit = error === null && progress !== null && !askingToReplace;

  return (
    <>
      <h1 className="appname">
        <AppMark />
        Nestling
      </h1>
      <p className="small setup__tagline">
        Your baby&rsquo;s size, week by week, as a seed, an egg, then a bird.
      </p>

      {askingToReplace && shared && saved ? (
        <ReplaceSheet
          onReplace={() => {
            setMethod(shared.method);
            setRawDate(shared.inputDate);
            setAskingToReplace(false);
          }}
          onKeep={() => {
            setMethod(saved.method);
            setRawDate(saved.inputDate);
            setAskingToReplace(false);
          }}
        />
      ) : null}

      <form
        className="setup__form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit || !parsed) return;
          save(method, formatIsoDate(parsed));
          navigate(hrefFor({ name: 'today' }));
        }}
      >
        <div ref={methodHelp.containerRef}>
          <div className="field">
            <span className="field__head">
              <label htmlFor="method">Count from</label>
              <button
                className="info__button"
                aria-label="How each method is calculated"
                {...methodHelp.triggerProps}
              >
                i
              </button>
            </span>
            <select
              id="method"
              className="ctl"
              value={method}
              onChange={(event) => {
                changeMethod(event.target.value as DatingMethod);
              }}
            >
              {METHODS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.option}
                </option>
              ))}
            </select>
          </div>
          <div className="info__panel" {...methodHelp.panelProps}>
            {METHODS.map((entry) => (
              <div key={entry.id}>
                <span>{entry.option}</span>
                <span className="mono">{entry.formula}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field__head" htmlFor="date">
            {info.dateLabel}
          </label>
          <input
            id="date"
            className="ctl"
            type="date"
            value={rawDate}
            {...(error && rawDate !== '' ? { 'aria-invalid': true } : {})}
            aria-describedby={error && rawDate !== '' ? 'date-error' : undefined}
            onChange={(event) => {
              setRawDate(event.target.value);
            }}
          />
          {error && rawDate !== '' ? (
            <p className="field__error" id="date-error" role="alert">
              {VALIDATION_MESSAGE[error.kind]}
            </p>
          ) : null}
        </div>

        <div className="preview">
          <div>
            <div className="preview__label">{derivedLine?.label ?? 'Due date'}</div>
            <div className="preview__value">{derivedLine?.value ?? '—'}</div>
          </div>
          <div>
            <div className="preview__label">Today you are</div>
            <div className="preview__value">
              {progress ? previewProgress(progress) : '—'}
            </div>
          </div>
        </div>

        <button className="btn" type="submit" disabled={!canSubmit}>
          Start counting
        </button>
      </form>
    </>
  );
}

function previewProgress(progress: ReturnType<typeof computeProgress>): string {
  if (progress.status === 'invalid') return 'not started yet';
  return formatWeeksAndDays(progress);
}

function ReplaceSheet({
  onReplace,
  onKeep,
}: {
  onReplace: () => void;
  onKeep: () => void;
}) {
  // Focus the sheet when it appears so a keyboard user lands on the question.
  useEffect(() => {
    document.getElementById('replace-sheet')?.focus();
  }, []);

  return (
    <div
      className="sheet"
      id="replace-sheet"
      role="dialog"
      aria-modal="false"
      aria-labelledby="replace-title"
      tabIndex={-1}
    >
      <p className="sheet__title" id="replace-title">
        Replace your saved date with the shared one?
      </p>
      <div className="sheet__actions">
        <button type="button" className="btn" onClick={onReplace}>
          Use the shared date
        </button>
        <button type="button" className="btn btn--quiet" onClick={onKeep}>
          Keep mine
        </button>
      </div>
    </div>
  );
}
