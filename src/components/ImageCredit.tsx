import type { ComparisonImage } from '../lib/schema';
import { macaulayAssetUrl } from './macaulay';
import { useDisclosure } from './useDisclosure';

/**
 * The credit for the week's photo (ADR-003), tucked behind an "i" in the
 * bottom-right corner of the image rather than set as a line under the card.
 *
 * Attribution is still required and still one tap away: CC BY 4.0 §3(a)(2)
 * lets the conditions be met "in any reasonable manner based on the medium",
 * and names a link to a resource carrying the information as an example. The
 * button is always visible over the photo, so nothing about the licence is
 * hidden — it is disclosed rather than omitted.
 *
 * Cornell's credit guidance wants the photographer, the library and the ML
 * number; Commons wants the author, the licence by name with a link, and a
 * link back to the file.
 */
export function ImageCredit({ image }: { image: ComparisonImage | null }) {
  const disclosure = useDisclosure();
  const credit = creditContent(image);
  if (!credit) return null;

  return (
    <div className="photo__credit" ref={disclosure.containerRef}>
      <button
        {...disclosure.triggerProps}
        className="photo__credit-button"
        aria-label={disclosure.open ? 'Hide photo credit' : 'Show photo credit'}
      >
        i
      </button>
      <p {...disclosure.panelProps} className="photo__credit-panel">
        {credit}
      </p>
    </div>
  );
}

function creditContent(image: ComparisonImage | null): React.ReactNode {
  if (!image || image.provider === null) return null;

  if (image.provider === 'macaulay' && image.mlAssetId) {
    return (
      <>
        Photo: {image.credit ?? 'Macaulay Library contributor'} / Macaulay Library at the
        Cornell Lab of Ornithology{' '}
        <a href={macaulayAssetUrl(image.mlAssetId)}>ML{image.mlAssetId}</a>.
      </>
    );
  }

  if (image.provider === 'commons' && image.author && image.license) {
    return (
      <>
        Photo: {image.author},{' '}
        {image.licenseUrl ? <a href={image.licenseUrl}>{image.license}</a> : image.license},
        via{' '}
        {image.sourceUrl ? (
          <a href={image.sourceUrl}>Wikimedia Commons</a>
        ) : (
          'Wikimedia Commons'
        )}
        .
      </>
    );
  }

  return null;
}
