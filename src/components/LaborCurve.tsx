import { cdf, CURVE_FIRST_DAY, CURVE_LAST_DAY, pdf } from '../lib/laborProbability';
import './LaborCurve.css';

const WIDTH = 264;
const HEIGHT = 110;
const LEFT = 26;
const RIGHT = 256;
const BASELINE = 90;
const TOP = 20;

/**
 * The daily curve from mockup 4, drawn as inline SVG straight from the model:
 * no chart library, and no hard-coded path. Every colour is a skin token.
 *
 * The y axis is the unconditional daily density, which is what makes the shape
 * read as "when labour happens" rather than as a hazard that only ever climbs.
 */
export function LaborCurve({
  gestationalDays,
  dueDay,
}: {
  gestationalDays: number;
  dueDay: number;
}) {
  const days: number[] = [];
  for (let day = CURVE_FIRST_DAY; day <= CURVE_LAST_DAY; day += 1) days.push(day);

  const peak = Math.max(...days.map((day) => pdf(day)));
  const x = (day: number) =>
    LEFT + ((day - CURVE_FIRST_DAY) / (CURVE_LAST_DAY - CURVE_FIRST_DAY)) * (RIGHT - LEFT);
  const y = (density: number) => BASELINE - (density / peak) * (BASELINE - TOP);

  const line = days
    .map((day) => `${x(day).toFixed(1)} ${y(pdf(day)).toFixed(1)}`)
    .join(' L ');
  const area = `M ${line} L ${x(CURVE_LAST_DAY).toFixed(1)} ${BASELINE} L ${x(CURVE_FIRST_DAY).toFixed(1)} ${BASELINE} Z`;

  const todayX = x(clamp(gestationalDays, CURVE_FIRST_DAY, CURVE_LAST_DAY));
  const dueX = x(clamp(dueDay, CURVE_FIRST_DAY, CURVE_LAST_DAY));

  return (
    <figure className="curve">
      <svg
        className="curve__svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={describe(gestationalDays)}
      >
        <line className="curve__axis" x1={LEFT} y1={BASELINE} x2={RIGHT} y2={BASELINE} />
        <line className="curve__grid" x1={LEFT} y1={55} x2={RIGHT} y2={55} />
        <line className="curve__grid" x1={LEFT} y1={TOP} x2={RIGHT} y2={TOP} />

        <path className="curve__area" d={area} />
        <path className="curve__line" d={`M ${line}`} />

        <line className="curve__today" x1={todayX} y1={16} x2={todayX} y2={BASELINE} />
        <line className="curve__due" x1={dueX} y1={16} x2={dueX} y2={BASELINE} />

        {[34, 36, 38, 40, 42].map((week) => (
          <text
            key={week}
            className="curve__label"
            x={x(week * 7)}
            y={104}
            textAnchor="middle"
          >
            {week}w
          </text>
        ))}
      </svg>
      <figcaption className="legend">
        <span>
          <i className="legend__line" /> daily chance
        </span>
        <span>
          <i className="legend__today" /> today
        </span>
        <span>
          <i className="legend__due" /> due date
        </span>
      </figcaption>
    </figure>
  );
}

/** The accessible description; a chart no one can read is not a chart. */
function describe(gestationalDays: number): string {
  const soFar = Math.round(cdf(gestationalDays) * 100);
  return (
    'Daily chance of spontaneous labor from 34 to 43 weeks. ' +
    'The curve rises to a peak just after the due date and falls away after it. ' +
    `About ${soFar} per cent of pregnancies have started labor by today.`
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
