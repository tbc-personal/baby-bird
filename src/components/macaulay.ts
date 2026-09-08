/**
 * ADR-003. Every Macaulay Library URL in the app is built from these two
 * templates and an asset id, so a change to Cornell's pattern is a one-line fix.
 *
 * VERIFICATION STATUS: the exact embed `src` could NOT be confirmed against a
 * live asset page during the build session. The sandbox's egress proxy refuses
 * CONNECT to macaulaylibrary.org and search.macaulaylibrary.org (the gateway
 * answers HTTP 403), so the "Embed" dialog was unreachable and no request ever
 * left the machine. The template below is the form ADR-003 predicted and is
 * UNVERIFIED against the live site.
 *
 * It is also currently unexercised: no row in data/comparisons.json carries an
 * mlAssetId, so every card falls back to the "Photo coming" silhouette and the
 * app is fully usable without it. Verify the pattern from an asset page's Embed
 * dialog before shipping any curated id. See docs/decisions/ADR-003-images.md
 * under "Embed mechanics" and docs/CURATION.md.
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
