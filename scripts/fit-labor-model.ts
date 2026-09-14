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
 *   Preterm = Normal(μ_p, σ_p)
 *
 * μ_p and σ_p are assumptions (see the note on LABOR_MODEL), so the fit solves
 * for the other three against the three targets:
 *
 *   preterm:   π Φ((259 − μ_p)/σ_p) + (1 − π) Φ((259 − μ_t)/σ_t) = 0.067
 *   median:    π Φ((283 − μ_p)/σ_p) + (1 − π) Φ((283 − μ_t)/σ_t) = 0.5
 *   post-term: π (1 − Φ((294 − μ_p)/σ_p)) + (1 − π) (1 − Φ((294 − μ_t)/σ_t)) = 0.06
 *
 * The preterm component was truncated to [140, 259) until 2026-09-14, which let
 * the three equations separate in closed form — and which was also the cause of
 * the 34–37 week trough, since it cut the density off at 37w0d exactly. Without
 * the truncation the preterm term no longer vanishes from any of the three, so
 * they are solved numerically instead: bisect σ_t and μ_t for the post-term and
 * median targets at a given π, then step π toward the preterm target and
 * repeat. See the third ADR-005 addendum.
 */
import {
  CALIBRATION,
  cdf,
  LABOR_MODEL,
  normalCdf,
  pdf,
  type MixtureParams,
} from '../src/lib/laborProbability.ts';

const MEDIAN_DAY = CALIBRATION.medianDay;
const PRETERM_DAY = CALIBRATION.pretermDay;
const POST_TERM_DAY = CALIBRATION.postTermDay;
const BEYOND_43_WEEKS_DAY = 43 * 7;

/** The two documented assumptions. */
const PRETERM_MEAN = 245;
const PRETERM_SD = 18;

/**
 * Mixture CDF for a candidate parameter set. Written out here rather than taken
 * from the app module so the fit does not depend on its default model while it
 * is being solved for.
 */
function mixtureCdf(day: number, m: MixtureParams): number {
  return (
    m.pretermWeight * normalCdf((day - m.pretermMean) / m.pretermSd) +
    (1 - m.pretermWeight) * normalCdf((day - m.termMean) / m.termSd)
  );
}

function fit(pretermMean: number, pretermSd: number): MixtureParams {
  // With the preterm component untruncated it contributes to all three targets,
  // so they no longer separate in closed form. Solve them as a nest: for a
  // given π, bisect σ_t against the post-term target with μ_t bisected against
  // the median inside it, then step π toward the preterm target and repeat.
  let pretermWeight: number = CALIBRATION.pretermShare;
  let termMean = 283.5;
  let termSd = 7;

  const medianFor = (pi: number, sd: number): number => {
    let low = 250;
    let high = 320;
    for (let i = 0; i < 60; i += 1) {
      const mid = (low + high) / 2;
      const model = {
        pretermWeight: pi,
        pretermMean,
        pretermSd,
        termMean: mid,
        termSd: sd,
      };
      // The median rises with μ_t, so bisect on it directly.
      if (mixtureCdf(MEDIAN_DAY, model) > 0.5) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  };

  for (let pass = 0; pass < 200; pass += 1) {
    let lowSd = 3;
    let highSd = 30;
    for (let i = 0; i < 60; i += 1) {
      const sd = (lowSd + highSd) / 2;
      const mean = medianFor(pretermWeight, sd);
      const model = { pretermWeight, pretermMean, pretermSd, termMean: mean, termSd: sd };
      if (1 - mixtureCdf(POST_TERM_DAY, model) < CALIBRATION.postTermTargetShare)
        lowSd = sd;
      else highSd = sd;
      termSd = sd;
      termMean = mean;
    }
    const model = { pretermWeight, pretermMean, pretermSd, termMean, termSd };
    const error = mixtureCdf(PRETERM_DAY, model) - CALIBRATION.pretermShare;
    if (Math.abs(error) < 1e-9) break;
    pretermWeight = Math.max(1e-4, Math.min(0.5, pretermWeight - error * 0.8));
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

console.log('Two-component mixture, fitted to all four targets (ADR-005 addendum 3).\n');
console.log(
  `Preterm component: Normal(${PRETERM_MEAN}, ${PRETERM_SD}), untruncated. ` +
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

console.log(
  '\nday   weeks    P(started by)   P(next 7 d | still pregnant)   most likely day',
);
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
  '\nThe 34-37 week band, which the truncated model got wrong. A trough between\n' +
    'a preterm process centred near 35 weeks and a term one near 40.5 is real;\n' +
    'the truncation made it a cliff. Weekly figures across the band:\n',
);
for (const week of [34, 35, 36, 37, 38]) {
  const day = week * 7;
  const next7 = (cdf(day + 7, fitted) - cdf(day, fitted)) / (1 - cdf(day, fitted));
  console.log(`  ${week}w0d  ${(next7 * 100).toFixed(2)}%`);
}
let worstFall = 0;
let worstDay = 0;
for (let day = 34 * 7; day < 40 * 7; day += 1) {
  const fall = 1 - pdf(day + 1, fitted) / pdf(day, fitted);
  if (fall > worstFall) {
    worstFall = fall;
    worstDay = day;
  }
}
console.log(
  `\n  largest single-day fall in density, 34w-40w: ${(worstFall * 100).toFixed(1)}% ` +
    `at day ${worstDay} (${Math.floor(worstDay / 7)}w${worstDay % 7}d)`,
);
console.log(
  '  The truncated model fell 94.5% in one day at 37w0d, which put the weekly\n' +
    '  figure lower at 37 weeks than at 34 and showed it as "under 1%".\n' +
    '  See the third ADR-005 addendum.',
);
