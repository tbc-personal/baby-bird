/**
 * ADR-003. Every Macaulay Library URL in the app is built from these two
 * templates and an asset id, so a change to Cornell's pattern is a one-line fix.
 *
 * VERIFIED 2026-09-08 against the Embed dialog on a live asset page: the URL
 * below is exactly what Cornell's markup uses.
 *
 * The route is nonetheless not shippable. macaulaylibrary.org sits behind
 * Anubis, a proof-of-work bot challenge, and it runs *inside the frame* — every
 * visitor watches a bot check where the photo should be. See ADR-003.
 */
export const MACAULAY_EMBED_TEMPLATE = 'https://macaulaylibrary.org/asset/{id}/embed';
export const MACAULAY_ASSET_URL = 'https://macaulaylibrary.org/asset/{id}';

/** The mockup's photo area; the embed keeps that box so the card does not jump. */
export const EMBED_HEIGHT = 150;

/** How long to wait for the frame before showing the offline goose (ADR-003). */
export const EMBED_TIMEOUT_MS = 6000;

/**
 * How long to wait for the IntersectionObserver before loading the frame
 * anyway. Lazy-loading is an optimisation, not a correctness requirement, and a
 * card whose observer never reports leaves the photo area stuck on "Loading
 * photo" for ever: with no frame there is nothing to time out, so the goose
 * never arrives either.
 */
export const EMBED_VISIBILITY_FALLBACK_MS = 1500;

export function macaulayEmbedUrl(assetId: string): string {
  return MACAULAY_EMBED_TEMPLATE.replace('{id}', encodeURIComponent(assetId));
}

export function macaulayAssetUrl(assetId: string): string {
  return MACAULAY_ASSET_URL.replace('{id}', encodeURIComponent(assetId));
}
