/**
 * ADR-005: spontaneous-labor probability.
 *
 * The day of spontaneous labor onset, counted in days from the LMP, is modelled
 * as a skew-normal variable with location ξ, scale ω and shape α < 0. A plain
 * normal cannot be made to fit: matched to the observed median it predicts far
 * too few preterm births, which is the whole reason for the left skew.
 *
 * Nothing here is scraped from Datayze. The three constraints below come from
 * published sources; the parameters were fitted to them offline by
 * `scripts/fit-labor-model.ts` and hard-coded, so the app does no numerical
 * optimisation at runtime. Re-run that script to reproduce them.
 *
 * Pure module: no clock, no state.
 */

/**
 * The calibration targets, and the one that could not be met.
 *
 * NOTE ON VERIFICATION: the build session could not open any of these pages.
 * Its egress proxy refuses cdc.gov, ncbi.nlm.nih.gov and datayze.com along with
 * everything else, so the figures are those recorded in
 * `docs/research/datayze-features.md` during planning, plus two adjustment
 * factors taken from general obstetric literature. Confirm all of them before
 * release. See docs/decisions/ADR-005-datayze-derived-features.md.
 */
export const CALIBRATION = {
  /**
   * Smith GCS 2001, "Use of time to event analysis to estimate the normal
   * duration of human pregnancy", Hum Reprod: median non-elective delivery at
   * 283 days after LMP. Met exactly by the fitted model.
   */
  medianDay: 283,
  medianSource: 'https://doi.org/10.1093/humrep/16.7.1497',

  /** Preterm is delivery before 37w0d, i.e. before day 259. */
  pretermDay: 259,

  /**
   * The headline CDC/NCHS figure: 10.4% of all US births in 2022 were preterm.
   * This is NOT the figure the model is fitted to, because it describes a
   * different population than the model does.
   */
  cdcAllBirthsPretermShare: 0.104,
  cdcYear: 2022,
  cdcSource: 'https://www.cdc.gov/maternal-infant-health/preterm-birth/index.html',

  /**
   * What the model is actually fitted to: the preterm share among *spontaneous
   * onset, singleton* pregnancies, which is what this distribution describes.
   * Two corrections take it there from the CDC figure:
   *
   *   1. Multiples. Twins and higher-order births are a small share of all
   *      births but a large share of preterm ones, and this model is explicitly
   *      singleton-only (ADR-005). The singleton preterm rate is roughly 9.3%.
   *   2. Provider-initiated delivery. Somewhere near 28% of preterm births are
   *      induced or delivered by scheduled caesarean for a medical indication,
   *      not by spontaneous onset. Spontaneous labour and PPROM account for the
   *      remaining ~72%.
   *
   *   0.093 x 0.72 = 0.067
   *
   * Both adjustment factors are round numbers from the general literature and
   * are the least well-sourced input to this model. They are the first thing to
   * check on review.
   */
  pretermShare: 0.067,

  /**
   * Post-term is delivery after 42w0d, i.e. after day 294. The build prompt
   * asks for roughly 6%, from Smith's survival curve.
   *
   * THIS CONSTRAINT IS NOT MET, and cannot be. See INFEASIBILITY below.
   */
  postTermDay: 294,
  postTermTargetShare: 0.06,
  postTermSource: 'https://doi.org/10.1093/humrep/16.7.1497',

  /**
   * Jukic AM et al. 2013, "Length of human pregnancy and contributors to its
   * natural variation", Hum Reprod. Not a fitted constraint; cited because it
   * is the best direct measurement of the spread, and the fitted omega sits in
   * its neighbourhood.
   */
  jukicSource: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3777570/',
} as const;

/**
 * INFEASIBILITY: why the post-term constraint is missed.
 *
 * The build prompt asks for three constraints at once: median 283, P(D < 259)
 * equal to the cited preterm share, and P(D > 294) around 6%. No skew-normal
 * satisfies all three. This is a property of the family, not of the optimiser,
 * and `scripts/fit-labor-model.ts` prints the proof:
 *
 *   Hold the median at 283 and the post-term share at 6% exactly, and sweep
 *   alpha. The implied preterm share rises monotonically with |alpha| and
 *   saturates at 4.75% as alpha goes to minus infinity, where the skew-normal
 *   degenerates into a half-normal. 4.75% is below both 6.7% and 10.4%, so no
 *   member of the family reaches either.
 *
 *   From the other side: hold the median at 283 and the preterm share at 10.4%,
 *   and the post-term share is forced above 18.8%.
 *
 * The tension is in the published numbers themselves, not only in the family.
 * Any distribution with F(259) = 0.104 and F(294) = 0.94 puts 83.6% of its mass
 * in the 35 days between, which drags the median to about 276 rather than 283.
 * A sufficiently peaked unimodal density could still be made to fit; the
 * skew-normal's shape is too rigid.
 *
 * The deviation chosen is the smallest one that keeps ADR-005 intact. ADR-005
 * names exactly two constraints and their tolerances: the median within one day
 * of 283, and P(< 37w) within 0.5 points of "the CDC figure used". Both are met
 * exactly. The post-term figure appears only in the build prompt, is stated
 * there as an approximation, and is described in the research doc as a range of
 * roughly 5 to 7 per cent, so it is the one that yields.
 *
 * There is a substantive reading under which the miss is smaller than it looks:
 * the fitted 12.5% describes pregnancies left entirely alone, whereas the
 * observed 6% comes from a population where most pregnancies past 41 weeks are
 * induced. The model has no induction in it. That is an argument for the
 * direction of the gap, not for its size, and the gap is reported rather than
 * explained away. It is the main open question on this model.
 */
export const FIT_RESIDUALS = {
  /** Met exactly. */
  medianDay: 283,
  /** Met exactly, against CALIBRATION.pretermShare. */
  pretermShare: 0.067,
  /** Missed: the model gives this against a target of about 0.06. */
  postTermShare: 0.1247,
  /** Kept deliberately non-zero so the curve does not claim 43 weeks is impossible. */
  beyond43WeeksShare: 0.0051,
} as const;

/**
 * The fitted triple. Produced by `npm run fit-labor-model`, which solves for xi
 * and omega so the median and preterm constraints hold exactly at a given
 * alpha, then picks the alpha that brings the post-term share as close to 6% as
 * it can while leaving a real tail past 43 weeks. The app does no numerical
 * optimisation at runtime.
 */
export interface SkewNormalParams {
  /** Location. Not the mean, and not the median, because the curve is skewed. */
  readonly xi: number;
  /** Scale, in days. */
  readonly omega: number;
  /** Shape. Negative is left-skewed, which is what the preterm tail needs. */
  readonly alpha: number;
}

export const LABOR_MODEL: SkewNormalParams = {
  xi: 296.9889,
  omega: 20.74,
  alpha: -6.75,
};

/** The panel appears from 34w0d (mockup 4). */
export const LABOR_PANEL_FROM_DAY = 34 * 7;

/** Plotting range for the daily curve: 34w0d to 43w0d. */
export const CURVE_FIRST_DAY = 34 * 7;
export const CURVE_LAST_DAY = 43 * 7;

// --- normal and skew-normal primitives -------------------------------------

const SQRT_2 = Math.SQRT2;
const SQRT_2PI = Math.sqrt(2 * Math.PI);

/**
 * erf by Abramowitz & Stegun 7.1.26. Maximum absolute error 1.5e-7, which is
 * three orders finer than any figure this app shows, and simple enough to check
 * against published values (see tests/unit/laborProbability.test.ts).
 */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const poly =
    t *
    (0.254829592 +
      t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return sign * (1 - poly * Math.exp(-z * z));
}

export function normalPdf(z: number): number {
  return Math.exp(-0.5 * z * z) / SQRT_2PI;
}

export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / SQRT_2));
}

/**
 * Owen's T function, by Simpson's rule on its defining integral:
 *   T(h, a) = (1 / 2π) ∫₀^a exp(-h²(1 + x²) / 2) / (1 + x²) dx
 * The integrand is smooth and bounded on [0, a], so a fixed fine grid is both
 * accurate and cheap. Symmetries reduce the argument first: T is even in h and
 * odd in a, and T(h, a) for |a| > 1 is reduced through the standard identity so
 * the integration range never gets long.
 */
export function owenT(h: number, a: number): number {
  if (a === 0) return 0;
  const hh = Math.abs(h);
  const sign = a < 0 ? -1 : 1;
  const aa = Math.abs(a);

  if (aa > 1) {
    // T(h, a) = ½[Φ(h) + Φ(ah)] − Φ(h)Φ(ah) − T(ah, 1/a)
    const value =
      0.5 * (normalCdf(hh) + normalCdf(aa * hh)) -
      normalCdf(hh) * normalCdf(aa * hh) -
      owenT(aa * hh, 1 / aa);
    return sign * value;
  }

  const steps = 200; // even, so Simpson applies
  const step = aa / steps;
  const f = (x: number) => Math.exp((-hh * hh * (1 + x * x)) / 2) / (1 + x * x);

  let total = f(0) + f(aa);
  for (let i = 1; i < steps; i += 1) {
    total += f(i * step) * (i % 2 === 1 ? 4 : 2);
  }
  return (sign * ((step / 3) * total)) / (2 * Math.PI);
}

/** Skew-normal density at `day`, in probability per day. */
export function pdf(day: number, model: SkewNormalParams = LABOR_MODEL): number {
  const z = (day - model.xi) / model.omega;
  return (2 / model.omega) * normalPdf(z) * normalCdf(model.alpha * z);
}

/** Skew-normal distribution function: P(D ≤ day). */
export function cdf(day: number, model: SkewNormalParams = LABOR_MODEL): number {
  const z = (day - model.xi) / model.omega;
  return clamp01(normalCdf(z) - 2 * owenT(z, model.alpha));
}

/** P(fromDay ≤ D ≤ toDay). */
export function probabilityInWindow(
  fromDay: number,
  toDay: number,
  model: SkewNormalParams = LABOR_MODEL,
): number {
  if (toDay <= fromDay) return 0;
  return clamp01(cdf(toDay, model) - cdf(fromDay, model));
}

/**
 * P(fromDay ≤ D ≤ toDay | D ≥ fromDay). This is the number the panel leads
 * with: the chance of labour starting in the window given it has not started
 * yet, which is what someone still pregnant today actually wants.
 */
export function conditionalProbabilityInWindow(
  fromDay: number,
  toDay: number,
  model: SkewNormalParams = LABOR_MODEL,
): number {
  if (toDay <= fromDay) return 0;
  const stillPregnant = 1 - cdf(fromDay, model);
  // Beyond the far tail the conditioning event has no probability left; the
  // honest answer there is 1, not a division by zero.
  if (stillPregnant <= 1e-12) return 1;
  return clamp01(probabilityInWindow(fromDay, toDay, model) / stillPregnant);
}

/** The single most likely day of onset, to the day. */
export function modeDay(model: SkewNormalParams = LABOR_MODEL): number {
  let best = CURVE_FIRST_DAY;
  let bestDensity = -1;
  for (let day = 200; day <= 320; day += 1) {
    const density = pdf(day, model);
    if (density > bestDensity) {
      bestDensity = density;
      best = day;
    }
  }
  return best;
}

/**
 * The most likely remaining day, given still pregnant on `fromDay`. Conditioning
 * only rescales the tail, so the peak is the unconditional mode unless that has
 * already passed.
 */
export function mostLikelyDayFrom(
  fromDay: number,
  model: SkewNormalParams = LABOR_MODEL,
): number {
  const mode = modeDay(model);
  return mode >= fromDay ? mode : fromDay;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
