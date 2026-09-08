import { COMPARISON_WEEKS } from '../data/comparisons';
import type { Units } from '../lib/storage';
import { formatLength, formatWeight } from '../lib/measures';
import {
  CONVENTION_SWITCH_AFTER_WEEK,
  CONVENTION_SWITCH_BEFORE_WEEK,
  FIRST_COMPARISON_WEEK,
  LAST_COMPARISON_WEEK,
} from '../lib/gestation';
import './MeasureChart.css';

export type Measure = 'length' | 'weight';

const WIDTH = 280;
const HEIGHT = 168;
const LEFT = 40;
const RIGHT = 268;
const TOP = 14;
const BASELINE = 128;
const AXIS_WEEKS = [2, 12, 22, 32, 42];

interface Point {
  readonly week: number;
  readonly value: number;
}

/**
 * Weeks 2–42 for one measure, dropping any row with no value for it (the
 * schema allows `null`; the current data never does, but the chart should not
 * assume that stays true).
 */
function pointsFor(measure: Measure): Point[] {
  return COMPARISON_WEEKS.flatMap((row) => {
    const value = measure === 'length' ? row.lengthIn : row.weightOz;
    return value === null ? [] : [{ week: row.week, value }];
  });
}

/**
 * The card's inset, opened. Weeks 2–42, one measure, plotted straight from
 * `COMPARISON_WEEKS` (no chart library, matching `LaborCurve`).
 *
 * Both measures span 3+ orders of magnitude over the 41 weeks (length: 0.014in
 * → 21in, ~1500×; weight: 0.04oz → 130oz, ~3200×). The task's complaint about
 * weight — early weeks collapsing onto the axis on a linear scale — is just as
 * true of length, only slightly less extreme by exponent. A log10 y axis is
 * used for both, so the size doublings of the first trimester stay visible
 * instead of flatlining against the baseline for two-thirds of the chart.
 */
export function MeasureChart({
  measure,
  currentWeek,
  units,
}: {
  measure: Measure;
  currentWeek: number;
  units: Units;
}) {
  const points = pointsFor(measure);
  const format = measure === 'length' ? formatLength : formatWeight;

  const values = points.map((point) => point.value);
  const logMin = Math.log10(Math.min(...values));
  const logMax = Math.log10(Math.max(...values));

  const x = (week: number) =>
    LEFT +
    ((week - FIRST_COMPARISON_WEEK) / (LAST_COMPARISON_WEEK - FIRST_COMPARISON_WEEK)) *
      (RIGHT - LEFT);
  const y = (value: number) =>
    BASELINE - ((Math.log10(value) - logMin) / (logMax - logMin)) * (BASELINE - TOP);

  const pathFor = (segment: Point[]) =>
    `M ${segment.map((point) => `${x(point.week).toFixed(1)} ${y(point.value).toFixed(1)}`).join(' L ')}`;

  // Length only: the crown-rump → head-to-heel switch (ADR-002) is a change of
  // ruler, not growth, so it is drawn as two disconnected segments rather than
  // one line running through it — a joined line would show a growth spurt that
  // never happened.
  const segments: Point[][] =
    measure === 'length'
      ? [
          points.filter((point) => point.week <= CONVENTION_SWITCH_BEFORE_WEEK),
          points.filter((point) => point.week >= CONVENTION_SWITCH_AFTER_WEEK),
        ]
      : [points];

  const current = points.find((point) => point.week === currentWeek) ?? null;

  // Gridlines at each power of ten the data actually spans; length and weight
  // sit in different decades so this can't be a fixed list.
  const gridValues: number[] = [];
  for (let power = Math.ceil(logMin); power <= Math.floor(logMax); power += 1) {
    gridValues.push(10 ** power);
  }

  const breakX =
    measure === 'length'
      ? (x(CONVENTION_SWITCH_BEFORE_WEEK) + x(CONVENTION_SWITCH_AFTER_WEEK)) / 2
      : null;

  return (
    <figure className="measure-chart">
      <svg
        className="measure-chart__svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={describe(measure, units, points, current)}
      >
        <line
          className="measure-chart__axis"
          x1={LEFT}
          y1={BASELINE}
          x2={RIGHT}
          y2={BASELINE}
        />

        {gridValues.map((value) => (
          <g key={value}>
            <line
              className="measure-chart__grid"
              x1={LEFT}
              y1={y(value)}
              x2={RIGHT}
              y2={y(value)}
            />
            <text
              className="measure-chart__tick"
              x={LEFT - 5}
              y={y(value) + 3}
              textAnchor="end"
            >
              {format(value, units)}
            </text>
          </g>
        ))}

        {segments.map((segment, index) =>
          segment.length > 0 ? (
            <path key={index} className="measure-chart__line" d={pathFor(segment)} />
          ) : null,
        )}

        {breakX !== null ? (
          <line
            className="measure-chart__break"
            x1={breakX}
            y1={TOP}
            x2={breakX}
            y2={BASELINE}
          />
        ) : null}

        {current ? (
          <>
            <line
              className="measure-chart__today"
              x1={x(current.week)}
              y1={TOP}
              x2={x(current.week)}
              y2={BASELINE}
            />
            <circle
              className="measure-chart__mark"
              cx={x(current.week)}
              cy={y(current.value)}
              r={3.5}
            />
          </>
        ) : null}

        {AXIS_WEEKS.map((week) => (
          <text
            key={week}
            className="measure-chart__label"
            x={x(week)}
            y={HEIGHT - 4}
            textAnchor="middle"
          >
            {week}w
          </text>
        ))}
      </svg>
      <figcaption className="legend">
        <span>
          <i className="legend__today" /> week {currentWeek}
        </span>
        {measure === 'length' ? (
          <span>
            <i className="legend__break" /> crown-to-rump → head-to-heel, week{' '}
            {CONVENTION_SWITCH_BEFORE_WEEK}→{CONVENTION_SWITCH_AFTER_WEEK}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}

/** The accessible description; a chart no one can read is not a chart. */
function describe(
  measure: Measure,
  units: Units,
  points: Point[],
  current: Point | null,
): string {
  const format = measure === 'length' ? formatLength : formatWeight;
  // `points` is `COMPARISON_WEEKS` filtered to one measure, and every row in
  // that table currently carries both, so it is never empty in practice.
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const label = measure === 'length' ? 'Length' : 'Weight';

  const range =
    `${label} from week ${first.week} to week ${last.week}, ` +
    `${format(first.value, units)} to ${format(last.value, units)}, ` +
    'plotted on a logarithmic scale because the early weeks are so much smaller than the later ones.';

  const breakNote =
    measure === 'length'
      ? ` The line breaks between week ${CONVENTION_SWITCH_BEFORE_WEEK} and week ${CONVENTION_SWITCH_AFTER_WEEK}: ` +
        'length is measured crown to rump through week 20 and head to heel from week 21, ' +
        'so that jump is a change of ruler, not growth.'
      : '';

  const currentNote = current
    ? ` This week, week ${current.week}, is ${format(current.value, units)}.`
    : '';

  return `${range}${breakNote}${currentNote}`;
}
