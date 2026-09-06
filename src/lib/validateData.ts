/**
 * Pure validation rules for `data/comparisons.json`. `scripts/validate-data.ts`
 * is a thin wrapper that reads the file, checks referenced image files exist,
 * and sets the exit code. Keeping the rules here makes them unit-testable.
 */
import { comparisonsSchema, type WeekRow } from './schema';
import {
  CONVENTION_SWITCH_AFTER_WEEK,
  CONVENTION_SWITCH_BEFORE_WEEK,
  FIRST_COMPARISON_WEEK,
  LAST_COMPARISON_WEEK,
} from './gestation';

export interface ValidationReport {
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly stats: {
    readonly weeks: number;
    readonly facts: number;
    readonly unreviewedFacts: number;
    readonly weeksMissingFacts: number;
    readonly weeksMissingImage: number;
  };
}

const EMPTY_STATS = {
  weeks: 0,
  facts: 0,
  unreviewedFacts: 0,
  weeksMissingFacts: 0,
  weeksMissingImage: 0,
} as const;

export function validateComparisons(raw: unknown): ValidationReport {
  const parsed = comparisonsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      errors: parsed.error.issues.map(
        (issue) => `schema: ${issue.path.join('.') || '(root)'}: ${issue.message}`,
      ),
      warnings: [],
      stats: EMPTY_STATS,
    };
  }

  const weeks: WeekRow[] = parsed.data.weeks;
  const errors: string[] = [];
  const warnings: string[] = [];

  // --- duplicate and missing weeks ----------------------------------------
  const counts = new Map<number, number>();
  for (const row of weeks) counts.set(row.week, (counts.get(row.week) ?? 0) + 1);
  for (const [week, count] of [...counts].sort((a, b) => a[0] - b[0])) {
    if (count > 1) errors.push(`duplicate week ${week} (${count} rows)`);
  }
  for (let week = 1; week <= LAST_COMPARISON_WEEK; week += 1) {
    if (!counts.has(week)) errors.push(`missing week ${week}`);
  }

  const byWeek = new Map(weeks.map((row) => [row.week, row]));

  // --- monotonic length and weight ----------------------------------------
  // Length must never decrease. The one documented exception is the jump
  // between weeks 20 and 21, where the convention changes from crown-rump to
  // crown-heel; that is an increase, so it needs no exemption from this rule,
  // but the convention itself is checked separately below.
  for (let week = FIRST_COMPARISON_WEEK + 1; week <= LAST_COMPARISON_WEEK; week += 1) {
    const current = byWeek.get(week);
    const previous = byWeek.get(week - 1);
    if (!current || !previous) continue;
    if (
      current.lengthIn !== null &&
      previous.lengthIn !== null &&
      current.lengthIn < previous.lengthIn
    ) {
      errors.push(
        `length decreases from week ${week - 1} (${previous.lengthIn} in) to week ${week} (${current.lengthIn} in)`,
      );
    }
    if (
      current.weightOz !== null &&
      previous.weightOz !== null &&
      current.weightOz < previous.weightOz
    ) {
      errors.push(
        `weight decreases from week ${week - 1} (${previous.weightOz} oz) to week ${week} (${current.weightOz} oz)`,
      );
    }
  }

  // --- the crown-rump → crown-heel convention -----------------------------
  const before = byWeek.get(CONVENTION_SWITCH_BEFORE_WEEK);
  const after = byWeek.get(CONVENTION_SWITCH_AFTER_WEEK);
  if (before && after && before.lengthIn !== null && after.lengthIn !== null) {
    if (after.lengthIn <= before.lengthIn) {
      errors.push(
        `week ${CONVENTION_SWITCH_AFTER_WEEK} should jump above week ${CONVENTION_SWITCH_BEFORE_WEEK} at the convention switch`,
      );
    }
  }
  for (const row of weeks) {
    if (row.lengthMeasure === null) continue;
    const expected =
      row.week <= CONVENTION_SWITCH_BEFORE_WEEK ? 'crown-rump' : 'crown-heel';
    if (row.lengthMeasure !== expected) {
      errors.push(
        `week ${row.week} is measured ${row.lengthMeasure}; the convention says ${expected}`,
      );
    }
  }

  // --- content every comparison row must carry ----------------------------
  let facts = 0;
  let unreviewedFacts = 0;
  let weeksMissingFacts = 0;
  let weeksMissingImage = 0;

  for (const row of weeks) {
    if (row.week === 1) continue; // week 1 carries no data, by design
    if (!row.comparison) errors.push(`week ${row.week} has no comparison`);
    if (!row.kind) errors.push(`week ${row.week} has no kind`);
    if (row.lengthIn === null) errors.push(`week ${row.week} has no length`);
    if (row.weightOz === null) errors.push(`week ${row.week} has no weight`);
    if (row.kind === 'bird' && !row.allAboutBirdsSlug) {
      errors.push(`week ${row.week} is a bird with no All About Birds slug`);
    }
    if (row.facts.length > 3) {
      errors.push(`week ${row.week} has ${row.facts.length} facts; at most 3 (ADR-004)`);
    }
    if (row.facts.length < 2) {
      weeksMissingFacts += 1;
      warnings.push(
        `week ${row.week} has ${row.facts.length} facts; 2–3 expected (ADR-004)`,
      );
    }
    facts += row.facts.length;
    unreviewedFacts += row.facts.filter((fact) => !fact.reviewed).length;

    if (!row.image || row.image.provider === null) {
      weeksMissingImage += 1;
      warnings.push(`week ${row.week} has no image yet; the card shows a silhouette`);
    }
  }

  return {
    errors,
    warnings,
    stats: {
      weeks: weeks.length,
      facts,
      unreviewedFacts,
      weeksMissingFacts,
      weeksMissingImage,
    },
  };
}

/** Commons rows name a file under `public/`; the script checks it exists. */
export function referencedImageFiles(
  raw: unknown,
): ReadonlyArray<{ week: number; file: string }> {
  const parsed = comparisonsSchema.safeParse(raw);
  if (!parsed.success) return [];
  return parsed.data.weeks.flatMap((row) =>
    row.image?.provider === 'commons' && row.image.file
      ? [{ week: row.week, file: row.image.file }]
      : [],
  );
}
