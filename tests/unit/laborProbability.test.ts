import { describe, expect, it } from 'vitest';
import {
  CALIBRATION,
  cdf,
  conditionalProbabilityInWindow,
  FIT_RESIDUALS,
  LABOR_MODEL,
  modeDay,
  mostLikelyDayFrom,
  normalCdf,
  normalPdf,
  pdf,
  probabilityInWindow,
} from '../../src/lib/laborProbability';

/** The median, solved rather than read off, so its tolerance is in days. */
function medianDay(): number {
  let low = 250;
  let high = 320;
  for (let i = 0; i < 100; i += 1) {
    const mid = (low + high) / 2;
    if (cdf(mid) < 0.5) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

describe('normal primitives', () => {
  // Published values, so a transcription error in erf cannot pass silently.
  it.each([
    [0, 0.5],
    [1, 0.8413447],
    [-1, 0.1586553],
    [1.96, 0.9750021],
    [-1.96, 0.0249979],
    [2.5758, 0.995],
    [-3, 0.0013499],
    [3, 0.9986501],
  ])('Phi(%f) = %f', (z, expected) => {
    expect(normalCdf(z)).toBeCloseTo(expected, 5);
  });

  it('the density peaks at zero and is symmetric', () => {
    expect(normalPdf(0)).toBeCloseTo(0.3989423, 6);
    expect(normalPdf(1)).toBeCloseTo(normalPdf(-1), 12);
    expect(normalPdf(1)).toBeCloseTo(0.2419707, 6);
  });
});

describe('the mixture', () => {
  it('is the weighted sum of its two untruncated components', () => {
    for (const day of [240, 259, 266, 283, 300]) {
      const term =
        (1 - LABOR_MODEL.pretermWeight) *
        normalCdf((day - LABOR_MODEL.termMean) / LABOR_MODEL.termSd);
      const preterm =
        LABOR_MODEL.pretermWeight *
        normalCdf((day - LABOR_MODEL.pretermMean) / LABOR_MODEL.pretermSd);
      expect(cdf(day)).toBeCloseTo(term + preterm, 10);
    }
  });

  /**
   * The preterm component used to be truncated at 37w0d, which made the density
   * fall eighteenfold in a single day there. It is untruncated now, so a little
   * of its mass lands after 37 weeks — which is the point: labor by the preterm
   * process does not become impossible the instant 37 weeks is reached.
   */
  it('leaves some preterm mass after 37 weeks, rather than cutting it off', () => {
    const after =
      LABOR_MODEL.pretermWeight *
      (1 -
        normalCdf(
          (CALIBRATION.pretermDay - LABOR_MODEL.pretermMean) / LABOR_MODEL.pretermSd,
        ));
    expect(after).toBeGreaterThan(0.01);
    expect(after).toBeLessThan(0.03);
  });

  /**
   * π is the share following the *preterm process*, which is not the same as
   * the share delivering preterm. Untruncated, some of that component lands
   * after 37 weeks, so π has to exceed the 6.7% preterm target to leave 6.7%
   * below day 259. It was 0.0669 while the component was truncated, when the
   * two quantities were forced to coincide.
   */
  it('gives the term component almost all of the mass', () => {
    expect(LABOR_MODEL.pretermWeight).toBeGreaterThan(CALIBRATION.pretermShare);
    expect(LABOR_MODEL.pretermWeight).toBeLessThan(0.1);
  });

  it('delivers the preterm target from a slightly larger preterm process', () => {
    // The gap between the two is the preterm component's own right tail.
    const spillover =
      LABOR_MODEL.pretermWeight *
      (1 -
        normalCdf(
          (CALIBRATION.pretermDay - LABOR_MODEL.pretermMean) / LABOR_MODEL.pretermSd,
        ));
    expect(cdf(CALIBRATION.pretermDay)).toBeCloseTo(CALIBRATION.pretermShare, 4);
    expect(LABOR_MODEL.pretermWeight - spillover).toBeLessThan(CALIBRATION.pretermShare);
  });
});

describe('the density is a proper density', () => {
  it('integrates to one over the plausible range', () => {
    let total = 0;
    const step = 0.01;
    for (let day = 100; day <= 400; day += step) total += pdf(day) * step;
    expect(total).toBeCloseTo(1, 3);
  });

  it('is never negative', () => {
    for (let day = 100; day <= 400; day += 1) {
      expect(pdf(day)).toBeGreaterThanOrEqual(0);
    }
  });

  it('the distribution function is non-decreasing and bounded', () => {
    let previous = 0;
    for (let day = 100; day <= 400; day += 1) {
      const value = cdf(day);
      expect(value).toBeGreaterThanOrEqual(previous - 1e-12);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
      previous = value;
    }
  });

  it('agrees with a numerical integral of its own density', () => {
    for (const day of [250, 270, 283, 295]) {
      let total = 0;
      const step = 0.005;
      for (let x = 100; x <= day; x += step) total += pdf(x) * step;
      expect(total).toBeCloseTo(cdf(day), 3);
    }
  });
});

describe('the calibration targets (ADR-005)', () => {
  it('the median is within one day of 283 (Smith 2001)', () => {
    expect(Math.abs(medianDay() - CALIBRATION.medianDay)).toBeLessThanOrEqual(1);
    expect(medianDay()).toBeCloseTo(FIT_RESIDUALS.medianDay, 2);
  });

  it('the preterm share is within 0.5 points of the figure used', () => {
    const got = cdf(CALIBRATION.pretermDay);
    expect(Math.abs(got - CALIBRATION.pretermShare)).toBeLessThanOrEqual(0.005);
    expect(got).toBeCloseTo(FIT_RESIDUALS.pretermShare, 4);
  });

  it('the term spread is the figure Jukic measures', () => {
    expect(LABOR_MODEL.termSd).toBe(CALIBRATION.termSd);
  });

  /**
   * The post-term share is an output, not a target, since 2026-09-15. Fitting
   * it to 6% forced the term spread to 6.8 days, which left almost nothing at
   * 37 weeks. This pins what the model now implies and that it exceeds the
   * observed figure, which is expected: the model contains no induction.
   */
  it('reports a post-term share above the observed one, and says so', () => {
    const got = 1 - cdf(CALIBRATION.postTermDay);
    expect(got).toBeCloseTo(FIT_RESIDUALS.postTermShare, 4);
    expect(got).toBeGreaterThan(CALIBRATION.postTermReferenceShare);
  });

  /**
   * The failure that started all of this: at 37w0d the panel read a 1.3% chance
   * over a whole week, lower than the rate a day earlier and a quarter of what
   * the only measured distribution to hand implies. The weekly figure must now
   * rise every day from 34 weeks on.
   */
  it('rises every day from 34 weeks to 43 weeks', () => {
    let previous = -1;
    for (let day = 34 * 7; day <= 43 * 7; day += 1) {
      const value = conditionalProbabilityInWindow(day, day + 7);
      expect(value, `day ${day}`).toBeGreaterThanOrEqual(previous - 1e-12);
      previous = value;
    }
  });

  it('gives 37 weeks a plausible weekly chance, not a rounding artefact', () => {
    const at37 = conditionalProbabilityInWindow(37 * 7, 38 * 7);
    expect(at37).toBeGreaterThan(0.03);
    expect(at37).toBeLessThan(0.05);
  });

  /**
   * The reason the family changed. A left-skewed curve puts its mode to the
   * right of its median, which showed "most likely single day" eight days after
   * the due date. A symmetric term component puts them back together.
   */
  it('the mode sits within two days of the median', () => {
    const mode = modeDay();
    expect(Math.abs(mode - medianDay())).toBeLessThanOrEqual(
      CALIBRATION.modeWithinDaysOfMedian,
    );
    expect(mode).toBe(FIT_RESIDUALS.modeDay);
  });

  it('leaves real mass past 43 weeks rather than calling it impossible', () => {
    expect(1 - cdf(43 * 7)).toBeGreaterThan(0.003);
    expect(1 - cdf(43 * 7)).toBeCloseTo(FIT_RESIDUALS.beyond43WeeksShare, 3);
  });
});

describe('probabilityInWindow', () => {
  it('is the difference of the distribution function', () => {
    expect(probabilityInWindow(266, 273)).toBeCloseTo(cdf(273) - cdf(266), 10);
  });

  it('is zero for an empty or reversed window', () => {
    expect(probabilityInWindow(280, 280)).toBe(0);
    expect(probabilityInWindow(280, 270)).toBe(0);
  });

  it('sums to one over the whole range', () => {
    expect(probabilityInWindow(100, 400)).toBeCloseTo(1, 4);
  });
});

describe('conditionalProbabilityInWindow', () => {
  it('is P(from <= D <= to | D >= from)', () => {
    const from = 266;
    const to = 273;
    const expected = (cdf(to) - cdf(from)) / (1 - cdf(from));
    expect(conditionalProbabilityInWindow(from, to)).toBeCloseTo(expected, 10);
  });

  it('is at least the unconditional probability', () => {
    for (let day = 238; day <= 294; day += 1) {
      expect(conditionalProbabilityInWindow(day, day + 7)).toBeGreaterThanOrEqual(
        probabilityInWindow(day, day + 7) - 1e-12,
      );
    }
  });

  /**
   * The headline number on the panel. From 37 weeks on it has to rise, or hold,
   * every single day: a number that dipped as the due date approached would
   * read as the pregnancy going backwards.
   */
  it('is monotonically non-decreasing from 37 weeks to 43 weeks', () => {
    let previous = -1;
    for (let day = CALIBRATION.pretermDay; day <= 43 * 7; day += 1) {
      const value = conditionalProbabilityInWindow(day, day + 7);
      expect(value, `day ${day}`).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = value;
    }
  });

  /**
   * Superseded. This used to assert the 34-37 week readings sat in a flat band
   * between 1% and 2%, which is what the narrow term component produced and
   * what made 37 weeks read as low as 34. The band rises now; "rises every day
   * from 34 weeks" above is the assertion that replaced it.
   */
  it('separates the late-preterm weeks from the early-term ones', () => {
    const at = (day: number) => conditionalProbabilityInWindow(day, day + 7);
    // 34 to 36 weeks stay low: labor there is genuinely uncommon.
    for (const week of [34, 35, 36]) {
      expect(at(week * 7), `week ${week}`).toBeLessThan(0.02);
    }
    // 37 weeks is several times 34, not equal to it.
    expect(at(37 * 7)).toBeGreaterThan(at(34 * 7) * 2);
  });

  /**
   * The cliff itself, pinned directly: the truncation made the density fall
   * 94.5% in one day at 37w0d. Nothing in the late-preterm weeks may fall by
   * more than a few per cent a day now.
   */
  it('has no single-day cliff in the density between 34 and 40 weeks', () => {
    let worst = 0;
    let worstDay = 0;
    for (let day = 34 * 7; day < 40 * 7; day += 1) {
      const fall = 1 - pdf(day + 1) / pdf(day);
      if (fall > worst) {
        worst = fall;
        worstDay = day;
      }
    }
    expect(worst, `worst fall at day ${worstDay}`).toBeLessThan(0.05);
    expect(worst).toBeCloseTo(FIT_RESIDUALS.worstDailyFall34to40, 3);
  });

  it('stays a probability', () => {
    for (let day = 200; day <= 330; day += 1) {
      const value = conditionalProbabilityInWindow(day, day + 7);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('is zero for an empty window and one far past the tail', () => {
    expect(conditionalProbabilityInWindow(280, 280)).toBe(0);
    expect(conditionalProbabilityInWindow(400, 407)).toBe(1);
  });

  it('gives plausible readings at the weeks the panel covers', () => {
    // Sanity anchors, so a change to the parameters shows up as a diff here.
    expect(conditionalProbabilityInWindow(34 * 7, 34 * 7 + 7)).toBeGreaterThan(0.005);
    expect(conditionalProbabilityInWindow(34 * 7, 34 * 7 + 7)).toBeLessThan(0.05);
    expect(conditionalProbabilityInWindow(40 * 7, 40 * 7 + 7)).toBeGreaterThan(0.25);
    expect(conditionalProbabilityInWindow(40 * 7, 40 * 7 + 7)).toBeLessThan(0.7);
  });
});

describe('mode helpers', () => {
  it('the mode sits beside the due date, not a week past it', () => {
    const mode = modeDay();
    expect(mode).toBeGreaterThan(280);
    expect(mode).toBeLessThan(287);
  });

  it('the most likely remaining day never precedes today', () => {
    expect(mostLikelyDayFrom(238)).toBe(modeDay());
    expect(mostLikelyDayFrom(300)).toBe(300);
  });
});
