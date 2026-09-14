import type { ComparisonImage } from '../lib/schema';
import { PhotoFrame } from './MacaulayEmbed';

/**
 * A Wikimedia Commons photo shipped in `public/images/` (ADR-003, weeks 2–6).
 * The file is local, so it works offline and the app never calls Commons at
 * runtime. Attribution is required and rides in the corner of the frame as an
 * `ImageCredit` disclosure, passed in so every image kind credits the same way.
 */
export function CommonsImage({
  image,
  base,
  credit,
}: {
  image: ComparisonImage;
  base: string;
  /** Rendered in the corner of the frame; see `ImageCredit`. */
  credit?: React.ReactNode;
}) {
  if (!image.file) return null;
  return (
    <PhotoFrame tag={null} credit={credit}>
      <img
        className="photo__img"
        src={`${base}${image.file.replace(/^\/+/, '')}`}
        alt={image.altText ?? ''}
        loading="lazy"
        decoding="async"
        // Curated per photograph; see `objectPosition` in the schema for why
        // the centre of the file is so often the wrong place to crop from.
        style={image.objectPosition ? { objectPosition: image.objectPosition } : undefined}
      />
    </PhotoFrame>
  );
}
