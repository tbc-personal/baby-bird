import { describe, expect, it } from 'vitest';
import {
  comparisonPhrase,
  formatLength,
  formatWeight,
  indefiniteArticle,
  lengthLabel,
  weightDetail,
  weightNeedsDetail,
} from '../../src/lib/measures';
import { COMPARISON_WEEKS } from '../../src/data/comparisons';

describe('formatLength', () => {
  it.each([
    [11.38, 'imperial', '11.4 in'],
    [6.46, 'imperial', '6.5 in'],
    [0.014, 'imperial', '0.014 in'],
    [21, 'imperial', '21 in'],
    [11.38, 'metric', '28.9 cm'],
    [0.014, 'metric', '0.04 cm'],
  ] as const)('%f %s → %s', (value, units, expected) => {
    expect(formatLength(value, units)).toBe(expected);
  });
});

describe('formatWeight', () => {
  it.each([
    [17.6, 'imperial', '1 lb 1.6 oz'],
    [16, 'imperial', '1 lb 0 oz'],
    [15.17, 'imperial', '15.17 oz'],
    [0.04, 'imperial', '0.04 oz'],
    [129.92, 'imperial', '8 lb 1.9 oz'],
    [17.6, 'metric', '499 g'],
    [0.04, 'metric', '1 g'],
    [0.02, 'metric', '0.57 g'],
  ] as const)('%f %s → %s', (value, units, expected) => {
    expect(formatWeight(value, units)).toBe(expected);
  });
});

describe('weight detail', () => {
  it('repeats the ounce figure once the headline is in pounds', () => {
    expect(weightNeedsDetail(17.6, 'imperial')).toBe(true);
    expect(weightNeedsDetail(15, 'imperial')).toBe(false);
    expect(weightNeedsDetail(17.6, 'metric')).toBe(false);
    expect(weightDetail(17.6, 'imperial', false)).toBe('weight (17.6 oz)');
  });

  it('says "under" for the rows whose weight is an upper bound', () => {
    expect(weightDetail(0.04, 'imperial', true)).toBe('weight, under 0.04 oz');
  });
});

describe('lengthLabel', () => {
  it.each([
    ['crown-rump', 'length, crown to rump'],
    ['crown-heel', 'length, head to heel'],
    [null, 'length'],
  ] as const)('%s', (measure, expected) => {
    expect(lengthLabel(measure)).toBe(expected);
  });
});

describe('indefiniteArticle', () => {
  it.each([
    ['Atlantic Puffin', 'an'],
    ['American Robin egg', 'an'],
    ['Blue Jay', 'a'],
    ['House Wren egg', 'a'],
    ['Poppy seed', 'a'],
    ['Osprey', 'an'],
  ] as const)('%s → %s', (name, expected) => {
    expect(indefiniteArticle(name)).toBe(expected);
  });

  it('builds the card phrase', () => {
    expect(comparisonPhrase('American Robin egg')).toBe('an American Robin egg');
    expect(comparisonPhrase('Blue Jay')).toBe('a Blue Jay');
  });
});

describe('every comparison name in the data gets a sensible article', () => {
  // The article rule is deliberately naive (first letter only). This guards the
  // assumption that no row in the data is an exception ("a one-way", "an hour").
  const EXCEPTIONS = /^(one|once|eu|ewe|ubiquit|uni|use|user|utens|hour|honest|heir)/i;

  it.each(COMPARISON_WEEKS.map((row) => row.comparison ?? ''))('%s', (name) => {
    expect(name).not.toMatch(EXCEPTIONS);
  });
});
