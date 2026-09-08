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
  PRETERM_SUPPORT,
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
  it('is the term component alone once the preterm support has closed', () => {
    for (const day of [259, 266, 283, 300]) {
      const term =
        (1 - LABOR_MODEL.pretermWeight) *
        normalCdf((day - LABOR_MODEL.termMean) / LABOR_MODEL.termSd);
      expect(cdf(day)).toBeCloseTo(term + LABOR_MODEL.pretermWeight, 10);
    }
  });

  it('places the whole preterm component before 37 weeks', () => {
    // Everything the preterm component contributes has arrived by day 259.
    expect(cdf(PRETERM_SUPPORT.lastDayExclusive)).toBeCloseTo(
      LABOR_MODEL.pretermWeight +
        (1 - LABOR_MODEL.pretermWeight) *
          normalCdf(
            (PRETERM_SUPPORT.lastDayExclusive - LABOR_MODEL.termMean) / LABOR_MODEL.termSd,
          ),
      10,
    );
  });

  it('gives the term component almost all of the mass', () => {
    expect(LABOR_MODEL.pretermWeight).toBeGreaterThan(0.05);
    expect(LABOR_MODEL.pretermWeight).toBeLessThan(0.08);
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

describe('the calibration targets (ADR-005, second addendum)', () => {
  it('the median is within one day of 283 (Smith 2001)', () => {
    expect(Math.abs(medianDay() - CALIBRATION.medianDay)).toBeLessThanOrEqual(1);
    expect(medianDay()).toBeCloseTo(FIT_RESIDUALS.medianDay, 2);
  });

  it('the preterm share is within 0.5 points of the figure used', () => {
    const got = cdf(CALIBRATION.pretermDay);
    expect(Math.abs(got - CALIBRATION.pretermShare)).toBeLessThanOrEqual(0.005);
    expect(got).toBeCloseTo(FIT_RESIDUALS.pretermShare, 4);
  });

  it('the post-term share is within 1.5 points of 6%', () => {
    const got = 1 - cdf(CALIBRATION.postTermDay);
    expect(Math.abs(got - CALIBRATION.postTermTargetShare)).toBeLessThanOrEqual(0.015);
    expect(got).toBeCloseTo(FIT_RESIDUALS.postTermShare, 4);
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
   * Between 34 and 37 weeks it is NOT monotonic, and this test pins the size of
   * the dip rather than pretending otherwise. The preterm component runs out at
   * 37w0d before the term one has begun, so the hazard falls there. It is a
   * property of the four calibration targets, not of the assumed preterm shape:
   * 6.7% of onsets have to fit below day 259 while the term component
   * contributes almost nothing there. See the second ADR-005 addendum; this is
   * the model's main open question for review.
   */
  it('dips between 34 and 37 weeks, by the documented amount', () => {
    const at = (day: number) => conditionalProbabilityInWindow(day, day + 7);
    expect(at(34 * 7)).toBeGreaterThan(at(CALIBRATION.pretermDay));
    // The whole dip stays inside a range that reads as "unlikely either way".
    for (let day = 34 * 7; day <= CALIBRATION.pretermDay; day += 1) {
      expect(at(day), `day ${day}`).toBeGreaterThan(0.004);
      expect(at(day), `day ${day}`).toBeLessThan(0.02);
    }
    expect(at(CALIBRATION.pretermDay)).toBeCloseTo(0.0048, 3);
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
