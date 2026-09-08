/**
 * ADR-003. Every Macaulay Library URL in the app is built from these two
 * templates and an asset id, so a change to Cornell's pattern is a one-line fix.
 *
 * VERIFIED 2026-09-08 against the Embed dialog on a live asset page. Cornell's
 * "Medium" option produces exactly:
 *
 *   <iframe src="https://macaulaylibrary.org/asset/664524507/embed"
 *           height="552" width="640" frameborder="0" allowfullscreen></iframe>
 *
 * so the URL below is right. The dimensions are the part that needed changing:
 * the frame is a 640x552 document — the photo with Cornell's own credit bar
 * beneath it — and the old fixed 150px height clipped almost all of it away.
 */
export const MACAULAY_EMBED_TEMPLATE = 'https://macaulaylibrary.org/asset/{id}/embed';
export const MACAULAY_ASSET_URL = 'https://macaulaylibrary.org/asset/{id}';

/**
 * Cornell's own embed dimensions, from the Embed dialog's "Medium" option. The
 * frame is scaled to the card's width and keeps this ratio, because the framed
 * document lays itself out for this shape: forcing the mockup's 150px strip on
 * it clipped the photo and hid the credit bar entirely.
 *
 * `Photo.css` holds the ratio; these are exported so the iframe carries the
 * width/height attributes Cornell's markup does, which fixes the frame's
 * intrinsic size before CSS applies and stops the card jumping as it loads.
 */
export const EMBED_WIDTH = 640;
export const EMBED_HEIGHT = 552;

/** The silhouette and goose placeholders keep the mockup's original strip. */
export const PLACEHOLDER_HEIGHT = 150;

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
