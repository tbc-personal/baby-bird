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
  owenT,
  pdf,
  probabilityInWindow,
} from '../../src/lib/laborProbability';

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

describe("Owen's T", () => {
  it('T(0, a) = atan(a) / 2pi', () => {
    expect(owenT(0, 1)).toBeCloseTo(Math.PI / 4 / (2 * Math.PI), 8);
    expect(owenT(0, 0.5)).toBeCloseTo(Math.atan(0.5) / (2 * Math.PI), 8);
    expect(owenT(0, 3)).toBeCloseTo(Math.atan(3) / (2 * Math.PI), 6);
  });

  it('T(h, 1) = Phi(h)(1 - Phi(h)) / 2', () => {
    for (const h of [0.25, 1, 2, 3]) {
      expect(owenT(h, 1)).toBeCloseTo((normalCdf(h) * (1 - normalCdf(h))) / 2, 7);
    }
  });

  it('is even in h and odd in a', () => {
    expect(owenT(1.3, 0.7)).toBeCloseTo(owenT(-1.3, 0.7), 10);
    expect(owenT(1.3, -0.7)).toBeCloseTo(-owenT(1.3, 0.7), 10);
    expect(owenT(2, 0)).toBe(0);
  });
});

describe('the skew-normal reduces to the normal at alpha = 0', () => {
  it.each([-3, -1, 0, 1, 2, 3])('z = %i', (z) => {
    expect(cdf(z, { xi: 0, omega: 1, alpha: 0 })).toBeCloseTo(normalCdf(z), 7);
  });
});

describe('the density is a proper density', () => {
  it('integrates to one over the plausible range', () => {
    let total = 0;
    const step = 0.01;
    for (let day = 150; day <= 400; day += step) total += pdf(day) * step;
    expect(total).toBeCloseTo(1, 4);
  });

  it('is never negative', () => {
    for (let day = 150; day <= 400; day += 1) {
      expect(pdf(day)).toBeGreaterThanOrEqual(0);
    }
  });

  it('the distribution function is non-decreasing and bounded', () => {
    let previous = 0;
    for (let day = 150; day <= 400; day += 1) {
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
      for (let x = 150; x <= day; x += step) total += pdf(x) * step;
      expect(total).toBeCloseTo(cdf(day), 3);
    }
  });
});

describe('the calibration constraints (ADR-005)', () => {
  it('the median is within one day of 283 (Smith 2001)', () => {
    // Solve F(d) = 0.5 rather than checking F(283), so the assertion is about
    // the median itself and its tolerance is in days.
    let low = 250;
    let high = 320;
    for (let i = 0; i < 100; i += 1) {
      const mid = (low + high) / 2;
      if (cdf(mid) < 0.5) low = mid;
      else high = mid;
    }
    const median = (low + high) / 2;
    expect(Math.abs(median - CALIBRATION.medianDay)).toBeLessThanOrEqual(1);
  });

  it('the preterm share is within 0.5 points of the figure used', () => {
    const got = cdf(CALIBRATION.pretermDay);
    expect(Math.abs(got - CALIBRATION.pretermShare)).toBeLessThanOrEqual(0.005);
  });

  /**
   * The third constraint is documented as missed. This test pins the size of
   * the miss so it cannot drift unnoticed; it is not an endorsement of it.
   * See the INFEASIBILITY note in src/lib/laborProbability.ts.
   */
  it('the post-term share is the documented miss, not something worse', () => {
    const got = 1 - cdf(CALIBRATION.postTermDay);
    expect(got).toBeCloseTo(FIT_RESIDUALS.postTermShare, 3);
    expect(got).toBeGreaterThan(CALIBRATION.postTermTargetShare);
  });

  it('no skew-normal can satisfy all three, which is why one is missed', () => {
    // Hold the median at 283 and the post-term share at 6%, and sweep alpha to
    // its limit. The best achievable preterm share stays below both the CDC
    // figure and the spontaneous one.
    const xiForMedian = (omega: number, alpha: number) => {
      let low = 150;
      let high = 460;
      for (let i = 0; i < 120; i += 1) {
        const mid = (low + high) / 2;
        if (cdf(283, { xi: mid, omega, alpha }) > 0.5) low = mid;
        else high = mid;
      }
      return (low + high) / 2;
    };
    const omegaForPostTerm = (alpha: number) => {
      let low = 1;
      let high = 140;
      for (let i = 0; i < 120; i += 1) {
        const omega = (low + high) / 2;
        const model = { xi: xiForMedian(omega, alpha), omega, alpha };
        if (1 - cdf(294, model) < 0.06) low = omega;
        else high = omega;
      }
      return (low + high) / 2;
    };

    let bestPreterm = 0;
    for (const alpha of [-1, -3, -10, -100, -1000]) {
      const omega = omegaForPostTerm(alpha);
      const model = { xi: xiForMedian(omega, alpha), omega, alpha };
      bestPreterm = Math.max(bestPreterm, cdf(259, model));
    }
    expect(bestPreterm).toBeLessThan(CALIBRATION.pretermShare);
    expect(bestPreterm).toBeLessThan(CALIBRATION.cdcAllBirthsPretermShare);
    expect(bestPreterm).toBeCloseTo(0.0475, 3);
  });

  it('leaves real mass past 43 weeks rather than calling it impossible', () => {
    expect(1 - cdf(43 * 7)).toBeGreaterThan(0.003);
    expect(1 - cdf(43 * 7)).toBeCloseTo(FIT_RESIDUALS.beyond43WeeksShare, 3);
  });

  it('is left-skewed, as the model requires', () => {
    expect(LABOR_MODEL.alpha).toBeLessThan(0);
    expect(modeDay()).toBeGreaterThan(CALIBRATION.medianDay);
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
   * The headline number on the panel. It has to rise, or hold, every single day
   * of the last trimester: a number that dipped as the due date approached
   * would read as the pregnancy going backwards.
   */
  it('is monotonically non-decreasing across the last trimester', () => {
    let previous = -1;
    for (let day = 28 * 7; day <= 42 * 7; day += 1) {
      const value = conditionalProbabilityInWindow(day, day + 7);
      expect(value, `day ${day}`).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = value;
    }
  });

  it('is also non-decreasing from the day the panel first appears', () => {
    let previous = -1;
    for (let day = 34 * 7; day <= 43 * 7; day += 1) {
      const value = conditionalProbabilityInWindow(day, day + 7);
      expect(value, `day ${day}`).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = value;
    }
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
    expect(conditionalProbabilityInWindow(40 * 7, 40 * 7 + 7)).toBeLessThan(0.6);
  });
});

describe('mode helpers', () => {
  it('the mode sits just after the due date', () => {
    const mode = modeDay();
    expect(mode).toBeGreaterThan(280);
    expect(mode).toBeLessThan(296);
  });

  it('the most likely remaining day never precedes today', () => {
    expect(mostLikelyDayFrom(238)).toBe(modeDay());
    expect(mostLikelyDayFrom(300)).toBe(300);
  });
});
