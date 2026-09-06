/**
 * Skin identifiers, kept in their own module so `lib/storage.ts` can validate a
 * persisted skin without importing the palettes (and their font declarations).
 */
export const SKIN_IDS = [
  'puffin',
  'kingfisher',
  'bluebird',
  'heron',
  'oriole',
  'goldfinch',
  'cardinal',
] as const;

export type SkinId = (typeof SKIN_IDS)[number];

export const DEFAULT_SKIN: SkinId = 'puffin';
