import { useEffect, useRef } from 'react';
import {
  computeProgress,
  CONVENTION_SWITCH_AFTER_WEEK,
  parseIsoDate,
} from '../lib/gestation';
import { hrefFor } from '../lib/router';
import { formatLength, formatWeight } from '../lib/measures';
import { COMPARISON_WEEKS } from '../data/comparisons';
import { Silhouette } from '../components/Silhouette';
import { useAppState } from '../useAppState';
import './Timeline.css';

/**
 * Mockup 3. All 41 rows, weeks 2–42, opened scrolled to the current week. Rows
 * carry a small kind silhouette rather than a photo thumbnail (ADR-003), and a
 * divider marks the crown-rump → crown-heel switch between weeks 20 and 21.
 */
export function TimelineScreen({ today }: { today: Date }) {
  const { saved, settings } = useAppState();
  const currentRef = useRef<HTMLAnchorElement>(null);

  const inputDate = saved ? parseIsoDate(saved.inputDate) : null;
  const currentWeek =
    saved && inputDate
      ? computeProgress(saved.method, inputDate, today).comparisonWeek
      : null;

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' });
  }, [currentWeek]);

  return (
    <>
      <h1 className="appname timeline__title">All 41 weeks</h1>
      <div className="meta">
        <span>Seeds 2&ndash;6 · Eggs 7&ndash;13 · Birds 14&ndash;42</span>
        <span className="mono">{settings.units === 'metric' ? 'cm / g' : 'in / oz'}</span>
      </div>

      <ol className="rows">
        {COMPARISON_WEEKS.map((row) => {
          const isCurrent = row.week === currentWeek;
          return (
            <li key={row.week}>
              {row.week === CONVENTION_SWITCH_AFTER_WEEK ? (
                <p className="switch">▲ crown to rump · ▼ head to heel</p>
              ) : null}
              <a
                className={isCurrent ? 'row row--now' : 'row'}
                href={hrefFor({ name: 'week', week: row.week })}
                data-current-week={isCurrent ? 'true' : undefined}
                ref={isCurrent ? currentRef : undefined}
                {...(isCurrent ? { 'aria-current': 'true' as const } : {})}
              >
                <span className="row__week mono">
                  {row.week}
                  {isCurrent ? ' ●' : ''}
                </span>
                <span className="row__mark" aria-hidden="true">
                  {row.kind ? <Silhouette kind={row.kind} size={20} /> : null}
                </span>
                <span className="row__name">
                  <b>{row.comparison}</b>
                  <span>
                    {row.scientificName}
                    {isCurrent ? ' · this week' : ''}
                  </span>
                </span>
                <span className="row__size mono">
                  {row.lengthIn !== null ? formatLength(row.lengthIn, settings.units) : ''}
                  <br />
                  {row.weightOz !== null ? formatWeight(row.weightOz, settings.units) : ''}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </>
  );
}
