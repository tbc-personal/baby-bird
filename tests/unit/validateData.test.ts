import { describe, expect, it } from 'vitest';
import { referencedImageFiles, validateComparisons } from '../../src/lib/validateData';
import {
  CONVENTION_SWITCH_AFTER_WEEK,
  CONVENTION_SWITCH_BEFORE_WEEK,
  FIRST_COMPARISON_WEEK,
  LAST_COMPARISON_WEEK,
} from '../../src/lib/gestation';
import realData from '../../data/comparisons.json';

// --- local fixture shapes (raw JSON shape, before zod defaults apply) ------

type RawKind = 'seed' | 'egg' | 'bird';
type RawLengthMeasure = 'crown-rump' | 'crown-heel';

interface RawFact {
  text: string;
  sources: string[];
  reviewed: boolean;
}

interface RawImage {
  provider: 'macaulay' | 'commons' | null;
  mlAssetId?: string | null;
  fallbackMlAssetId?: string | null;
  embedUrl?: string | null;
  credit?: string | null;
  altText?: string | null;
  file?: string | null;
  author?: string | null;
  license?: string | null;
  licenseUrl?: string | null;
  sourceUrl?: string | null;
}

interface RawWeek {
  week: number;
  lengthIn: number | null;
  lengthMeasure: RawLengthMeasure | null;
  weightOz: number | null;
  weightIsUpperBound: boolean;
  kind: RawKind | null;
  comparison: string | null;
  sourceComparisonText: string | null;
  scientificName: string | null;
  wikipediaTitle: string | null;
  allAboutBirdsSlug: string | null;
  ebirdSpeciesCode: string | null;
  image: RawImage | null;
  facts: RawFact[];
}

interface RawFile {
  lengthConvention: string;
  weeks: RawWeek[];
}

function makeFact(n: number): RawFact {
  return {
    text: `Fact number ${n} about this stage of development.`,
    sources: ['https://example.com/source'],
    reviewed: true,
  };
}

function week1(): RawWeek {
  return {
    week: 1,
    lengthIn: null,
    lengthMeasure: null,
    weightOz: null,
    weightIsUpperBound: false,
    kind: null,
    comparison: null,
    sourceComparisonText: null,
    scientificName: null,
    wikipediaTitle: null,
    allAboutBirdsSlug: null,
    ebirdSpeciesCode: null,
    image: null,
    facts: [],
  };
}

function kindFor(week: number): RawKind {
  if (week <= 14) return 'seed';
  if (week <= 28) return 'egg';
  return 'bird';
}

function makeWeeks(): RawWeek[] {
  const weeks: RawWeek[] = [week1()];
  for (let week = 2; week <= 42; week += 1) {
    const kind = kindFor(week);
    weeks.push({
      week,
      lengthIn: Number((week * 0.1).toFixed(2)),
      lengthMeasure: week <= CONVENTION_SWITCH_BEFORE_WEEK ? 'crown-rump' : 'crown-heel',
      weightOz: Number((week * 0.2).toFixed(2)),
      weightIsUpperBound: false,
      kind,
      comparison: `Comparison for week ${week}`,
      sourceComparisonText: null,
      scientificName: null,
      wikipediaTitle: null,
      allAboutBirdsSlug: kind === 'bird' ? `slug-${week}` : null,
      ebirdSpeciesCode: null,
      image: null,
      facts: [makeFact(1), makeFact(2)],
    });
  }
  return weeks;
}

function makeFile(overrides: Partial<RawFile> = {}): RawFile {
  return {
    lengthConvention: 'Crown-rump length through week 20; crown-heel length from week 21.',
    weeks: makeWeeks(),
    ...overrides,
  };
}

/** Replace one week's row with `patch` merged in. */
function withWeek(weeks: RawWeek[], week: number, patch: Partial<RawWeek>): RawWeek[] {
  return weeks.map((row) => (row.week === week ? { ...row, ...patch } : row));
}

function withoutWeek(weeks: RawWeek[], week: number): RawWeek[] {
  return weeks.filter((row) => row.week !== week);
}

function findWeek(weeks: RawWeek[], week: number): RawWeek {
  const row = weeks.find((w) => w.week === week);
  if (!row) throw new Error(`fixture bug: no week ${week}`);
  return row;
}

const validCommonsImage = (): RawImage => ({
  provider: 'commons',
  file: 'images/week-30.jpg',
  author: 'Jane Doe',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:example.jpg',
});

const validMacaulayImage = (): RawImage => ({
  provider: 'macaulay',
  mlAssetId: '123456',
});

// ---------------------------------------------------------------------------

describe('validateComparisons: valid fixture', () => {
  it('produces zero errors for a well-formed file', () => {
    const report = validateComparisons(makeFile());
    expect(report.errors).toEqual([]);
  });
});

describe('validateComparisons: structural errors', () => {
  it('flags a duplicated week number', () => {
    const weeks = makeFile().weeks;
    const dup = { ...findWeek(weeks, 5) };
    const report = validateComparisons(makeFile({ weeks: [...weeks, dup] }));
    expect(report.errors.some((e) => e.includes('duplicate week 5'))).toBe(true);
  });

  it('flags a missing week in the middle of the range', () => {
    const weeks = withoutWeek(makeFile().weeks, 17);
    const report = validateComparisons(makeFile({ weeks }));
    expect(report.errors.some((e) => e.includes('missing week 17'))).toBe(true);
  });

  it('flags a missing week 1', () => {
    const weeks = withoutWeek(makeFile().weeks, 1);
    const report = validateComparisons(makeFile({ weeks }));
    expect(report.errors.some((e) => e.includes('missing week 1'))).toBe(true);
  });

  it('flags length that decreases between consecutive weeks', () => {
    const base = makeFile().weeks;
    const week9 = findWeek(base, 9);
    expect(week9.lengthIn).not.toBeNull();
    const weeks = withWeek(base, 10, { lengthIn: (week9.lengthIn as number) - 0.1 });
    const report = validateComparisons(makeFile({ weeks }));
    expect(
      report.errors.some(
        (e) => e.includes('length decreases from week 9 ') && e.includes('week 10'),
      ),
    ).toBe(true);
  });

  it('flags weight that decreases between consecutive weeks', () => {
    const base = makeFile().weeks;
    const week14 = findWeek(base, 14);
    expect(week14.weightOz).not.toBeNull();
    const weeks = withWeek(base, 15, { weightOz: (week14.weightOz as number) - 0.1 });
    const report = validateComparisons(makeFile({ weeks }));
    expect(
      report.errors.some(
        (e) => e.includes('weight decreases from week 14 ') && e.includes('week 15'),
      ),
    ).toBe(true);
  });

  it('flags a convention-switch week that does not jump above the previous week', () => {
    const base = makeFile().weeks;
    const week20 = findWeek(base, CONVENTION_SWITCH_BEFORE_WEEK);
    const weeks = withWeek(base, CONVENTION_SWITCH_AFTER_WEEK, {
      lengthIn: week20.lengthIn,
    });
    const report = validateComparisons(makeFile({ weeks }));
    expect(
      report.errors.some((e) =>
        e.includes(
          `week ${CONVENTION_SWITCH_AFTER_WEEK} should jump above week ${CONVENTION_SWITCH_BEFORE_WEEK}`,
        ),
      ),
    ).toBe(true);
  });

  it('flags a lengthMeasure on the wrong side of the convention switch', () => {
    const base = makeFile().weeks;
    const weeks = withWeek(withWeek(base, 25, { lengthMeasure: 'crown-rump' }), 10, {
      lengthMeasure: 'crown-heel',
    });
    const report = validateComparisons(makeFile({ weeks }));
    expect(
      report.errors.some(
        (e) => e.includes('week 25 is measured crown-rump') && e.includes('crown-heel'),
      ),
    ).toBe(true);
    expect(
      report.errors.some(
        (e) => e.includes('week 10 is measured crown-heel') && e.includes('crown-rump'),
      ),
    ).toBe(true);
  });

  it('flags a bird row with no All About Birds slug', () => {
    const birdWeek = findWeek(makeFile().weeks, 30);
    expect(birdWeek.kind).toBe('bird');
    const weeks = withWeek(makeFile().weeks, 30, { allAboutBirdsSlug: null });
    const report = validateComparisons(makeFile({ weeks }));
    expect(
      report.errors.some((e) =>
        e.includes('week 30 is a bird with no All About Birds slug'),
      ),
    ).toBe(true);
  });
});

describe('validateComparisons: facts', () => {
  it('flags a row with more than 3 facts', () => {
    const weeks = withWeek(makeFile().weeks, 5, {
      facts: [makeFact(1), makeFact(2), makeFact(3), makeFact(4)],
    });
    const report = validateComparisons(makeFile({ weeks }));
    expect(report.errors.some((e) => e.includes('week 5 has 4 facts; at most 3'))).toBe(
      true,
    );
  });

  it('rejects a fact text longer than 160 characters (schema)', () => {
    const longText = 'x'.repeat(161);
    const weeks = withWeek(makeFile().weeks, 5, {
      facts: [
        { text: longText, sources: ['https://example.com'], reviewed: true },
        makeFact(2),
      ],
    });
    const report = validateComparisons(makeFile({ weeks }));
    expect(
      report.errors.some(
        (e) => e.includes('weeks.4.facts.0.text') && e.includes('160 characters'),
      ),
    ).toBe(true);
  });

  it('rejects a fact text containing an exclamation mark (schema)', () => {
    const weeks = withWeek(makeFile().weeks, 5, {
      facts: [
        { text: 'Wow, amazing!', sources: ['https://example.com'], reviewed: true },
        makeFact(2),
      ],
    });
    const report = validateComparisons(makeFile({ weeks }));
    expect(
      report.errors.some(
        (e) => e.includes('weeks.4.facts.0.text') && e.includes('exclamation'),
      ),
    ).toBe(true);
  });

  it('rejects a fact with an empty sources array (schema)', () => {
    const weeks = withWeek(makeFile().weeks, 5, {
      facts: [
        { text: 'A fact with no sources.', sources: [], reviewed: true },
        makeFact(2),
      ],
    });
    const report = validateComparisons(makeFile({ weeks }));
    expect(
      report.errors.some(
        (e) => e.includes('weeks.4.facts.0.sources') && e.includes('at least one source'),
      ),
    ).toBe(true);
  });

  it('rejects a fact with a non-URL source string (schema)', () => {
    const weeks = withWeek(makeFile().weeks, 5, {
      facts: [
        { text: 'A fact with a bad source.', sources: ['not-a-url'], reviewed: true },
        makeFact(2),
      ],
    });
    const report = validateComparisons(makeFile({ weeks }));
    expect(report.errors.some((e) => e.includes('weeks.4.facts.0.sources.0'))).toBe(true);
  });
});

describe('validateComparisons: images (schema)', () => {
  it.each(['file', 'author', 'license', 'licenseUrl', 'sourceUrl'] as const)(
    'rejects a commons image missing %s',
    (field) => {
      const image = validCommonsImage();
      image[field] = null;
      const weeks = withWeek(makeFile().weeks, 30, { image });
      const report = validateComparisons(makeFile({ weeks }));
      expect(report.errors.some((e) => e.includes(field))).toBe(true);
    },
  );

  it('rejects a commons image with a disallowed license', () => {
    const image = { ...validCommonsImage(), license: 'CC BY-NC 4.0' };
    const weeks = withWeek(makeFile().weeks, 30, { image });
    const report = validateComparisons(makeFile({ weeks }));
    expect(
      report.errors.some(
        (e) => e.includes('license') && e.includes('not on the allowed list'),
      ),
    ).toBe(true);
  });

  it('rejects a macaulay image with a null mlAssetId', () => {
    const image: RawImage = { provider: 'macaulay', mlAssetId: null };
    const weeks = withWeek(makeFile().weeks, 30, { image });
    const report = validateComparisons(makeFile({ weeks }));
    expect(report.errors.some((e) => e.includes('mlAssetId'))).toBe(true);
  });
});

describe('validateComparisons: malformed input', () => {
  it.each([null, {}, { weeks: 'nope' }])('rejects %j', (bad) => {
    const report = validateComparisons(bad);
    expect(report.errors.length).toBeGreaterThan(0);
    expect(report.stats).toEqual({
      weeks: 0,
      facts: 0,
      unreviewedFacts: 0,
      weeksMissingFacts: 0,
      weeksMissingImage: 0,
    });
  });
});

describe('validateComparisons: warnings vs errors', () => {
  it('warns (but does not error) on a week with fewer than 2 facts', () => {
    const weeks = withWeek(withWeek(makeFile().weeks, 5, { facts: [] }), 6, {
      facts: [makeFact(1)],
    });
    const report = validateComparisons(makeFile({ weeks }));
    expect(report.errors).toEqual([]);
    expect(report.warnings.some((w) => w.includes('week 5 has 0 facts'))).toBe(true);
    expect(report.warnings.some((w) => w.includes('week 6 has 1 facts'))).toBe(true);
  });

  it('warns (but does not error) on a week with no image', () => {
    // The baseline fixture already carries image: null throughout; confirm
    // that alone produces no errors, only warnings.
    const report = validateComparisons(makeFile());
    expect(report.errors).toEqual([]);
    expect(report.warnings.some((w) => w.includes('week 2 has no image yet'))).toBe(true);
  });

  it('computes stats correctly against a controlled fixture', () => {
    const base = makeFile().weeks;
    const weeks = withWeek(withWeek(base, 5, { facts: [] }), 30, {
      image: validCommonsImage(),
    }).map((row) =>
      row.week === 6 ? { ...row, facts: [{ ...makeFact(1), reviewed: false }] } : row,
    );

    const report = validateComparisons(makeFile({ weeks }));
    expect(report.errors).toEqual([]);

    // weeks 2..42 each start with 2 facts (82 total); week 5 has 0 (-2),
    // week 6 has 1 (-1) => 82 - 2 - 1 = 79.
    expect(report.stats.weeks).toBe(42);
    expect(report.stats.facts).toBe(79);
    // Only week 6's single fact was marked unreviewed.
    expect(report.stats.unreviewedFacts).toBe(1);
    // Weeks with < 2 facts: week 5 (0) and week 6 (1).
    expect(report.stats.weeksMissingFacts).toBe(2);
    // All 41 data-carrying weeks lack an image except week 30, which now has one.
    expect(report.stats.weeksMissingImage).toBe(40);
  });
});

describe('referencedImageFiles', () => {
  it('returns week/file pairs for commons rows only', () => {
    const weeks = withWeek(
      withWeek(makeFile().weeks, 20, { image: validCommonsImage() }),
      30,
      {
        image: validMacaulayImage(),
      },
    );
    const result = referencedImageFiles(makeFile({ weeks }));
    expect(result).toEqual([{ week: 20, file: 'images/week-30.jpg' }]);
  });

  it('returns an empty array for invalid input', () => {
    expect(referencedImageFiles(null)).toEqual([]);
    expect(referencedImageFiles({})).toEqual([]);
    expect(referencedImageFiles({ weeks: 'nope' })).toEqual([]);
  });
});

describe('validateComparisons: real data', () => {
  it('data/comparisons.json produces zero errors', () => {
    const report = validateComparisons(realData);
    expect(report.errors).toEqual([]);
  });
});

// Keep the imported week-range constants exercised so a future change to
// FIRST_COMPARISON_WEEK / LAST_COMPARISON_WEEK is caught by this suite.
describe('sanity: fixture matches the gestation constants', () => {
  it('covers weeks 1..LAST_COMPARISON_WEEK, with data starting at week 1', () => {
    const weeks = makeFile().weeks;
    expect(weeks[0]?.week).toBe(1);
    expect(weeks[weeks.length - 1]?.week).toBe(LAST_COMPARISON_WEEK);
    expect(FIRST_COMPARISON_WEEK).toBe(2);
  });
});
