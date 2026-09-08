/**
 * Fits the two-component labor model offline (ADR-005) and prints its
 * residuals. Run with `npm run fit-labor-model`; paste the printed parameters
 * into `LABOR_MODEL` in src/lib/laborProbability.ts.
 *
 * The CDF comes from the same module the app uses, so a change to the numerics
 * cannot make the fit and the runtime disagree.
 *
 * The model:
 *
 *   D ~ π · Preterm + (1 − π) · Term
 *   Term    = Normal(μ_t, σ_t)
 *   Preterm = Normal(μ_p, σ_p) truncated to [140, 259)
 *
 * μ_p and σ_p are assumptions (see the note on LABOR_MODEL), so the fit solves
 * for the other three. Because the whole preterm component sits below day 259,
 * the three targets separate cleanly:
 *
 *   preterm:   π + (1 − π) Φ((259 − μ_t)/σ_t) = 0.067
 *   median:    π + (1 − π) Φ((283 − μ_t)/σ_t) = 0.5
 *   post-term: (1 − π) (1 − Φ((294 − μ_t)/σ_t)) = 0.06
 *
 * The last two give σ_t and μ_t in closed form once π is known, and the first
 * gives π once μ_t and σ_t are known, so a fixed point of that pair is the fit.
 * It converges in a few dozen passes from any sane start.
 */
import {
  CALIBRATION,
  cdf,
  LABOR_MODEL,
  normalCdf,
  pdf,
  PRETERM_SUPPORT,
  type MixtureParams,
} from '../src/lib/laborProbability.ts';

const MEDIAN_DAY = CALIBRATION.medianDay;
const PRETERM_DAY = CALIBRATION.pretermDay;
const POST_TERM_DAY = CALIBRATION.postTermDay;
const BEYOND_43_WEEKS_DAY = 43 * 7;

/** The two documented assumptions. */
const PRETERM_MEAN = 245;
const PRETERM_SD = 14;

/** Φ⁻¹ by bisection. Accurate enough at the precision the parameters are kept to. */
function probit(p: number): number {
  let low = -12;
  let high = 12;
  for (let i = 0; i < 200; i += 1) {
    const mid = (low + high) / 2;
    if (normalCdf(mid) < p) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

function fit(pretermMean: number, pretermSd: number): MixtureParams {
  let termMean = 283.5;
  let termSd = 7;
  let pretermWeight = CALIBRATION.pretermShare;

  for (let pass = 0; pass < 500; pass += 1) {
    // π from the preterm target, given the term component. The truncated
    // preterm component contributes all of its mass below day 259, so it enters
    // this equation as 1.
    const termBelowPreterm = normalCdf((PRETERM_DAY - termMean) / termSd);
    pretermWeight =
      (CALIBRATION.pretermShare - termBelowPreterm) / (1 - termBelowPreterm);

    // μ_t and σ_t from the median and post-term targets, given π.
    const zMedian = probit((0.5 - pretermWeight) / (1 - pretermWeight));
    const zPostTerm = probit(1 - CALIBRATION.postTermTargetShare / (1 - pretermWeight));
    termSd = (POST_TERM_DAY - MEDIAN_DAY) / (zPostTerm - zMedian);
    termMean = MEDIAN_DAY - zMedian * termSd;
  }

  return { pretermWeight, pretermMean, pretermSd, termMean, termSd };
}

function medianOf(model: MixtureParams): number {
  let low = 200;
  let high = 340;
  for (let i = 0; i < 200; i += 1) {
    const mid = (low + high) / 2;
    if (cdf(mid, model) < 0.5) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

function modeOf(model: MixtureParams): number {
  let best = 0;
  let bestDensity = -1;
  for (let day = 200; day <= 320; day += 0.05) {
    const density = pdf(day, model);
    if (density > bestDensity) {
      bestDensity = density;
      best = day;
    }
  }
  return best;
}

function describe(model: MixtureParams) {
  return {
    median: medianOf(model),
    mode: modeOf(model),
    preterm: cdf(PRETERM_DAY, model),
    postTerm: 1 - cdf(POST_TERM_DAY, model),
    beyond43: 1 - cdf(BEYOND_43_WEEKS_DAY, model),
  };
}

function row(label: string, target: string, got: string, verdict: string): void {
  console.log(label.padEnd(34) + target.padEnd(14) + got.padEnd(14) + verdict);
}

// ---------------------------------------------------------------------------
// 1. The fit.
// ---------------------------------------------------------------------------

const fitted = fit(PRETERM_MEAN, PRETERM_SD);
const stats = describe(fitted);

console.log('Two-component mixture, fitted to all four targets (ADR-005 addendum 2).\n');
console.log(
  `Preterm component: Normal(${PRETERM_MEAN}, ${PRETERM_SD}) truncated to ` +
    `[${PRETERM_SUPPORT.firstDay}, ${PRETERM_SUPPORT.lastDayExclusive}). ` +
    'Assumed, not fitted.\n',
);
console.log('export const LABOR_MODEL: MixtureParams = {');
console.log(`  pretermWeight: ${fitted.pretermWeight.toFixed(6)},`);
console.log(`  pretermMean: ${fitted.pretermMean},`);
console.log(`  pretermSd: ${fitted.pretermSd},`);
console.log(`  termMean: ${fitted.termMean.toFixed(4)},`);
console.log(`  termSd: ${fitted.termSd.toFixed(4)},`);
console.log('};\n');

console.log('residuals'.padEnd(34) + 'target'.padEnd(14) + 'fitted'.padEnd(14) + 'verdict');
row(
  'median of D',
  `${MEDIAN_DAY} ±1 d`,
  `${stats.median.toFixed(3)} d`,
  Math.abs(stats.median - MEDIAN_DAY) <= 1 ? 'met' : 'MISSED',
);
row(
  'P(D < 259), preterm',
  `${CALIBRATION.pretermShare.toFixed(4)} ±0.005`,
  stats.preterm.toFixed(4),
  Math.abs(stats.preterm - CALIBRATION.pretermShare) <= 0.005 ? 'met' : 'MISSED',
);
row(
  'P(D > 294), post-term',
  `${CALIBRATION.postTermTargetShare.toFixed(4)} ±0.015`,
  stats.postTerm.toFixed(4),
  Math.abs(stats.postTerm - CALIBRATION.postTermTargetShare) <= 0.015 ? 'met' : 'MISSED',
);
row(
  'mode of D, vs the median',
  `within ${CALIBRATION.modeWithinDaysOfMedian} d`,
  `${stats.mode.toFixed(2)} d (${(stats.mode - stats.median).toFixed(2)} d)`,
  Math.abs(stats.mode - stats.median) <= CALIBRATION.modeWithinDaysOfMedian
    ? 'met'
    : 'MISSED',
);
console.log('');
row('P(D > 43w), not a target', '> 0.003', stats.beyond43.toFixed(4), '');
row(
  'CDC all-births preterm',
  CALIBRATION.cdcAllBirthsPretermShare.toFixed(4),
  stats.preterm.toFixed(4),
  'not fitted: see CALIBRATION',
);

console.log('\nThe hard-coded LABOR_MODEL, for comparison:');
const hardCoded = describe(LABOR_MODEL);
console.log(
  `  median ${hardCoded.median.toFixed(3)}  preterm ${hardCoded.preterm.toFixed(4)}  ` +
    `post-term ${hardCoded.postTerm.toFixed(4)}  mode ${hardCoded.mode.toFixed(2)}`,
);

// ---------------------------------------------------------------------------
// 2. The sanity table, as the panel would read it.
// ---------------------------------------------------------------------------

console.log('\nday   weeks    P(started by)   P(next 7 d | still pregnant)   most likely day');
for (const day of [238, 259, 266, 273, 280, 287, 294]) {
  const weeks = `${Math.floor(day / 7)}w${day % 7}d`;
  const started = cdf(day, fitted);
  const still = 1 - started;
  const next7 = still <= 1e-12 ? 1 : (cdf(day + 7, fitted) - started) / still;
  const likely = Math.max(Math.round(stats.mode), day);
  console.log(
    `${day}   ${weeks.padEnd(8)} ${(started * 100).toFixed(1).padStart(6)}%` +
      `${(next7 * 100).toFixed(1).padStart(24)}%${String(likely).padStart(18)}`,
  );
}

// ---------------------------------------------------------------------------
// 3. Where the panel's headline figure falls rather than rises.
// ---------------------------------------------------------------------------

console.log(
  '\nThe 7-day figure is not monotonic between 34 and 37 weeks: the preterm\n' +
    'component runs out at 37w0d before the term one has begun. Every day of it:\n',
);
let previous = -1;
const dips: number[] = [];
for (let day = CALIBRATION.pretermDay - 21; day <= CALIBRATION.pretermDay; day += 1) {
  const still = 1 - cdf(day, fitted);
  const next7 = (cdf(day + 7, fitted) - cdf(day, fitted)) / still;
  if (next7 < previous - 1e-9) dips.push(day);
  previous = next7;
}
console.log(
  `  falls on ${dips.length} of the 21 days from 34w0d to 37w0d` +
    (dips.length > 0 ? `, first on day ${dips[0]} (${Math.floor(dips[0] / 7)}w${dips[0] % 7}d)` : ''),
);
console.log(
  '  It is a property of the four targets, not of μ_p and σ_p: 6.7% of onsets\n' +
    '  must fit below day 259 and the term component contributes almost nothing\n' +
    '  there, so the hazard has to fall somewhere in the late preterm weeks.\n' +
    '  Sweeping μ_p over [215, 245] and σ_p over [10, 26] moves the fall but\n' +
    '  never removes it. See the second ADR-005 addendum.',
);
