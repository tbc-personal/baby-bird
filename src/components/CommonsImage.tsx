import type { ComparisonImage } from '../lib/schema';
import { PhotoFrame } from './MacaulayEmbed';

/**
 * A Wikimedia Commons photo shipped in `public/images/` (ADR-003, weeks 2–6).
 * The file is local, so it works offline and the app never calls Commons at
 * runtime. Attribution is required and is rendered by `ImageCredit` below the
 * card, not here, so every image kind credits in the same place.
 */
export function CommonsImage({ image, base }: { image: ComparisonImage; base: string }) {
  if (!image.file) return null;
  return (
    <PhotoFrame tag={null}>
      <img
        className="photo__img"
        src={`${base}${image.file.replace(/^\/+/, '')}`}
        alt={image.altText ?? ''}
        loading="lazy"
        decoding="async"
      />
    </PhotoFrame>
  );
}
