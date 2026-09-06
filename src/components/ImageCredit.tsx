import type { ComparisonImage } from '../lib/schema';
import { macaulayAssetUrl } from './macaulay';

/**
 * The text credit under every image (ADR-003). Cornell's credit guidance wants
 * the photographer, the library, and the ML number; Commons wants the author,
 * the license by name with a link, and a link to the source file.
 */
export function ImageCredit({ image }: { image: ComparisonImage | null }) {
  if (!image || image.provider === null) return null;

  if (image.provider === 'macaulay' && image.mlAssetId) {
    return (
      <p className="credit">
        Photo: {image.credit ?? 'Macaulay Library contributor'} / Macaulay Library at the
        Cornell Lab of Ornithology{' '}
        <a href={macaulayAssetUrl(image.mlAssetId)}>ML{image.mlAssetId}</a>.
      </p>
    );
  }

  if (image.provider === 'commons' && image.author && image.license) {
    return (
      <p className="credit">
        Photo: {image.author},{' '}
        {image.licenseUrl ? <a href={image.licenseUrl}>{image.license}</a> : image.license},
        via{' '}
        {image.sourceUrl ? (
          <a href={image.sourceUrl}>Wikimedia Commons</a>
        ) : (
          'Wikimedia Commons'
        )}
        .
      </p>
    );
  }

  return null;
}
