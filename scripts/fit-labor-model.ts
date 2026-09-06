/**
 * Fits the skew-normal labor model offline (ADR-005) and prints the proof that
 * the build prompt's three constraints cannot all be met. Run with
 * `npm run fit-labor-model`; paste the printed triple into `LABOR_MODEL` in
 * src/lib/laborProbability.ts.
 *
 * The CDF comes from the same module the app uses, so a change to the numerics
 * cannot make the fit and the runtime disagree.
 */
import { CALIBRATION, cdf } from '../src/lib/laborProbability.ts';

interface Model {
  xi: number;
  omega: number;
  alpha: number;
}

const MEDIAN_DAY = CALIBRATION.medianDay;
const PRETERM_DAY = CALIBRATION.pretermDay;
const POST_TERM_DAY = CALIBRATION.postTermDay;
const BEYOND_43_WEEKS_DAY = 43 * 7;

/**
 * A curve that says 43 weeks is impossible would be worse than one that misses
 * a published percentage, so the search keeps at least this much mass past it.
 * Post-term keeps improving as alpha falls, but only by draining this tail, so
 * the floor is what actually picks alpha.
 */
const MIN_BEYOND_43_WEEKS = 0.005;

/** Solve xi so the median lands on `MEDIAN_DAY`, for a given omega and alpha. */
function xiForMedian(omega: number, alpha: number): number {
  let low = 150;
  let high = 460;
  for (let i = 0; i < 200; i += 1) {
    const mid = (low + high) / 2;
    if (cdf(MEDIAN_DAY, { xi: mid, omega, alpha }) > 0.5) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/** Solve omega so the preterm share lands on `target`, holding the median. */
function omegaForPreterm(alpha: number, target: number): number {
  let low = 1;
  let high = 140;
  for (let i = 0; i < 200; i += 1) {
    const omega = (low + high) / 2;
    const model = { xi: xiForMedian(omega, alpha), omega, alpha };
    // A wider curve puts more mass below 37 weeks.
    if (cdf(PRETERM_DAY, model) < target) low = omega;
    else high = omega;
  }
  const omega = (low + high) / 2;
  return omega;
}

/** Solve omega so the post-term share lands on `target`, holding the median. */
function omegaForPostTerm(alpha: number, target: number): number {
  let low = 1;
  let high = 140;
  for (let i = 0; i < 200; i += 1) {
    const omega = (low + high) / 2;
    const model = { xi: xiForMedian(omega, alpha), omega, alpha };
    if (1 - cdf(POST_TERM_DAY, model) < target) low = omega;
    else high = omega;
  }
  return (low + high) / 2;
}

function describe(model: Model) {
  return {
    median: cdf(MEDIAN_DAY, model),
    preterm: cdf(PRETERM_DAY, model),
    postTerm: 1 - cdf(POST_TERM_DAY, model),
    beyond43: 1 - cdf(BEYOND_43_WEEKS_DAY, model),
  };
}

// ---------------------------------------------------------------------------
// 1. The infeasibility proof.
// ---------------------------------------------------------------------------

console.log('1. The three constraints cannot all be satisfied by a skew-normal.\n');
console.log(
  `   Holding the median at ${MEDIAN_DAY} and the post-term share at ` +
    `${(CALIBRATION.postTermTargetShare * 100).toFixed(0)}% exactly, the best the`,
);
console.log('   family can do on preterm is the limit as alpha goes to -infinity:\n');
console.log('     alpha        omega      implied preterm share');
for (const alpha of [-1, -2, -3, -5, -10, -30, -100, -1000]) {
  const omega = omegaForPostTerm(alpha, CALIBRATION.postTermTargetShare);
  const model = { xi: xiForMedian(omega, alpha), omega, alpha };
  console.log(
    `     ${String(alpha).padEnd(12)}${omega.toFixed(3).padEnd(11)}${describe(model).preterm.toFixed(4)}`,
  );
}
console.log(
  `\n   It saturates at about 4.75%, below both the CDC all-births figure ` +
    `(${(CALIBRATION.cdcAllBirthsPretermShare * 100).toFixed(1)}%)`,
);
console.log(
  `   and the spontaneous singleton figure the model uses ` +
    `(${(CALIBRATION.pretermShare * 100).toFixed(1)}%). No member of the family reaches either.\n`,
);

console.log('   From the other direction, holding the median and the CDC preterm share:\n');
{
  const alpha = -6;
  const omega = omegaForPreterm(alpha, CALIBRATION.cdcAllBirthsPretermShare);
  const model = { xi: xiForMedian(omega, alpha), omega, alpha };
  const stats = describe(model);
  console.log(
    `     alpha ${alpha}, omega ${omega.toFixed(3)} forces a post-term share of ` +
      `${(stats.postTerm * 100).toFixed(1)}%, against a target of 6%.\n`,
  );
}

// ---------------------------------------------------------------------------
// 2. The fit actually used: both ADR-005 constraints exactly, post-term yields.
// ---------------------------------------------------------------------------

console.log('2. The fit used. ADR-005 names two constraints; both are met exactly.');
console.log('   Alpha is swept, and the one whose post-term share comes closest to 6%');
console.log('   while leaving real mass past 43 weeks is chosen.\n');
console.log('     alpha    xi         omega      post-term   P(>43w)');

let best: { model: Model; postTerm: number } | null = null;
for (let alpha = -12; alpha <= -0.5; alpha += 0.25) {
  const omega = omegaForPreterm(alpha, CALIBRATION.pretermShare);
  const model = { xi: xiForMedian(omega, alpha), omega, alpha };
  const stats = describe(model);
  if (stats.beyond43 < MIN_BEYOND_43_WEEKS) continue;
  if (
    !best ||
    Math.abs(stats.postTerm - CALIBRATION.postTermTargetShare) <
      Math.abs(best.postTerm - CALIBRATION.postTermTargetShare)
  ) {
    best = { model, postTerm: stats.postTerm };
  }
}

for (const alpha of [-3, -4, -5, -6, -7, -8]) {
  const omega = omegaForPreterm(alpha, CALIBRATION.pretermShare);
  const model = { xi: xiForMedian(omega, alpha), omega, alpha };
  const stats = describe(model);
  console.log(
    `     ${String(alpha).padEnd(9)}${model.xi.toFixed(3).padEnd(11)}${omega.toFixed(3).padEnd(11)}` +
      `${stats.postTerm.toFixed(4).padEnd(12)}${stats.beyond43.toFixed(4)}`,
  );
}

if (!best) throw new Error('no feasible fit found');
const fitted = best.model;
const stats = describe(fitted);

console.log('\n   Chosen:\n');
console.log('export const LABOR_MODEL = {');
console.log(`  xi: ${fitted.xi.toFixed(4)},`);
console.log(`  omega: ${fitted.omega.toFixed(4)},`);
console.log(`  alpha: ${fitted.alpha},`);
console.log('} as const;\n');

console.log(
  'constraint'.padEnd(30) + 'target'.padEnd(12) + 'fitted'.padEnd(12) + 'verdict',
);
row('median F(283)', 0.5, stats.median, 0.005);
row('preterm F(259)', CALIBRATION.pretermShare, stats.preterm, 0.005);
row('post-term 1-F(294)', CALIBRATION.postTermTargetShare, stats.postTerm, 0.005);
console.log('');
row('CDC all-births preterm', CALIBRATION.cdcAllBirthsPretermShare, stats.preterm, 0.005);

console.log(
  '\nday    weeks    F(day)   daily chance in the next 7 days, if still pregnant',
);
for (const day of [238, 245, 252, 259, 266, 273, 280, 283, 287, 294, 301]) {
  const weeks = `${Math.floor(day / 7)}w${day % 7}d`;
  const still = 1 - cdf(day, fitted);
  const next7 = still <= 0 ? 1 : (cdf(day + 7, fitted) - cdf(day, fitted)) / still;
  console.log(
    `${day}    ${weeks.padEnd(8)} ${cdf(day, fitted).toFixed(4)}   ${(next7 * 100).toFixed(1)}%`,
  );
}

function row(label: string, target: number, got: number, tolerance: number): void {
  const verdict = Math.abs(got - target) <= tolerance ? 'met' : 'MISSED';
  console.log(
    label.padEnd(30) + target.toFixed(4).padEnd(12) + got.toFixed(4).padEnd(12) + verdict,
  );
}
