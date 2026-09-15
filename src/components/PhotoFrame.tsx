import { Silhouette } from './Silhouette';
import type { Kind } from '../lib/schema';
import './Photo.css';

/**
 * The photo area of a card: a fixed box with an optional corner tag. Shared by
 * the Commons image and the "Photo coming" placeholder.
 */
export function PhotoFrame({
  tag,
  credit,
  children,
}: {
  tag: string | null;
  /** The credit disclosure, pinned to the bottom-right corner of the image. */
  credit?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="photo">
      {tag ? <span className="photo__tag mono">{tag}</span> : null}
      {children}
      {credit}
    </div>
  );
}

/** No photo sourced for this week yet: the kind silhouette, with a tag saying so. */
export function PhotoComing({ kind }: { kind: Kind }) {
  return (
    <PhotoFrame tag="Photo coming">
      <Silhouette kind={kind} size={72} />
    </PhotoFrame>
  );
}
