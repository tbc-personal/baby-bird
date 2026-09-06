/**
 * The zod schema for `data/comparisons.json` (PLAN §3). Shared by the build-time
 * validator (`scripts/validate-data.ts`) and by the typed import in
 * `src/data/comparisons.ts`, so the runtime types and the CI check cannot drift.
 */
import { z } from 'zod';

export const KINDS = ['seed', 'egg', 'bird'] as const;
export const kindSchema = z.enum(KINDS);
export type Kind = z.infer<typeof kindSchema>;

export const LENGTH_MEASURES = ['crown-rump', 'crown-heel'] as const;
export const lengthMeasureSchema = z.enum(LENGTH_MEASURES);
export type LengthMeasure = z.infer<typeof lengthMeasureSchema>;

export const IMAGE_PROVIDERS = ['macaulay', 'commons'] as const;
export const imageProviderSchema = z.enum(IMAGE_PROVIDERS);
export type ImageProvider = z.infer<typeof imageProviderSchema>;

/** Licenses this project will ship. Anything else is rejected (ADR-003). */
export const ALLOWED_COMMONS_LICENSES = [
  'CC0',
  'CC BY 2.0',
  'CC BY 3.0',
  'CC BY 4.0',
  'CC BY-SA 3.0',
  'CC BY-SA 4.0',
  'Public domain',
] as const;

export const factSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(160, 'facts are one sentence, 160 characters or fewer (ADR-004)')
    .refine((t) => !t.includes('!'), 'facts carry no exclamation marks (ADR-004)'),
  sources: z
    .array(z.string().url())
    .min(1, 'every fact cites at least one source (ADR-004)'),
  reviewed: z.boolean(),
});
export type Fact = z.infer<typeof factSchema>;

export const imageSchema = z
  .object({
    provider: imageProviderSchema.nullable(),
    /** Macaulay Library numeric asset id, as a string of digits. */
    mlAssetId: z.string().regex(/^\d+$/).nullable().optional().default(null),
    /** A second curated id in case the primary asset is deleted (ADR-003). */
    fallbackMlAssetId: z.string().regex(/^\d+$/).nullable().optional().default(null),
    /** Present only for historical data; the app builds embed URLs from the id. */
    embedUrl: z.string().url().nullable().optional().default(null),
    credit: z.string().nullable().optional().default(null),
    altText: z.string().nullable().optional().default(null),
    /** Commons rows only: the file under `public/images/`, relative to the app base. */
    file: z.string().nullable().optional().default(null),
    author: z.string().nullable().optional().default(null),
    license: z.string().nullable().optional().default(null),
    licenseUrl: z.string().url().nullable().optional().default(null),
    sourceUrl: z.string().url().nullable().optional().default(null),
  })
  .superRefine((image, ctx) => {
    if (image.provider === 'commons') {
      for (const field of [
        'file',
        'author',
        'license',
        'licenseUrl',
        'sourceUrl',
      ] as const) {
        if (!image[field]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `commons images must carry ${field} for attribution (ADR-003)`,
          });
        }
      }
      if (
        image.license &&
        !(ALLOWED_COMMONS_LICENSES as readonly string[]).includes(image.license)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['license'],
          message: `license ${image.license} is not on the allowed list (CC0 / CC BY / CC BY-SA)`,
        });
      }
    }
    if (image.provider === 'macaulay' && !image.mlAssetId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mlAssetId'],
        message: 'a macaulay image needs an asset id',
      });
    }
  });
export type ComparisonImage = z.infer<typeof imageSchema>;

export const weekSchema = z.object({
  week: z.number().int().min(1).max(42),
  lengthIn: z.number().positive().nullable(),
  lengthMeasure: lengthMeasureSchema.nullable(),
  weightOz: z.number().positive().nullable(),
  weightIsUpperBound: z.boolean(),
  kind: kindSchema.nullable(),
  comparison: z.string().min(1).nullable(),
  sourceComparisonText: z.string().nullable(),
  scientificName: z.string().min(1).nullable(),
  wikipediaTitle: z.string().min(1).nullable(),
  allAboutBirdsSlug: z.string().min(1).nullable(),
  ebirdSpeciesCode: z.string().min(1).nullable(),
  image: imageSchema.nullable(),
  facts: z.array(factSchema),
  /** Week 3 only: a comparison the author has not signed off on yet. */
  proposed: z.boolean().optional(),
  proposalNote: z.string().optional(),
});
export type WeekRow = z.infer<typeof weekSchema>;

export const comparisonsSchema = z.object({
  $comment: z.string().optional(),
  lengthConvention: z.string(),
  weeks: z.array(weekSchema),
});
export type ComparisonsFile = z.infer<typeof comparisonsSchema>;
