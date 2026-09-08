import { useCallback, useEffect, useRef, useState } from 'react';
import { useOnline } from '../useOnline';
import { OfflineGoose } from './OfflineGoose';
import { Silhouette } from './Silhouette';
import type { Kind } from '../lib/schema';
import {
  EMBED_HEIGHT,
  EMBED_TIMEOUT_MS,
  EMBED_VISIBILITY_FALLBACK_MS,
  macaulayEmbedUrl,
} from './macaulay';
import './Photo.css';

type EmbedState = 'idle' | 'loading' | 'loaded' | 'failed';

export function MacaulayEmbed({
  assetId,
  kind,
  altText,
  credit,
}: {
  assetId: string;
  kind: Kind;
  altText: string;
  /** Rendered in the corner of the frame; see `ImageCredit`. */
  credit?: React.ReactNode;
}) {
  const online = useOnline();
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<EmbedState>('idle');
  const observerRef = useRef<IntersectionObserver | null>(null);

  /*
   * Lazy-load: the frame is only created once the card is near the viewport, so
   * the timeline and a scrolled-past card cost nothing (ADR-003).
   *
   * This is a callback ref rather than a mount effect because the holder is not
   * always mounted on the first render: a card that first renders offline shows
   * the goose instead, and the holder only appears when the connection returns.
   * A mount effect would run once against a null node and never observe
   * anything, leaving the photo permanently unloaded after coming back online.
   */
  const attachHolder = useCallback((holder: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!holder) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(holder);
    observerRef.current = observer;
  }, []);

  useEffect(
    () => () => {
      observerRef.current?.disconnect();
    },
    [],
  );

  /*
   * The observer is an optimisation, so never let it be the reason a photo
   * fails to appear. If it has not reported by the fallback, load anyway: a
   * card that never becomes `visible` creates no frame, and with no frame the
   * load timeout below never starts, so the area sits on "Loading photo" with
   * no goose and no request ever made.
   */
  useEffect(() => {
    if (visible) return;
    const timer = window.setTimeout(() => {
      setVisible(true);
    }, EMBED_VISIBILITY_FALLBACK_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [visible]);

  const shouldLoad = visible && online;

  useEffect(() => {
    if (!shouldLoad) return;
    setState('loading');
    const timer = window.setTimeout(() => {
      setState((current) => (current === 'loading' ? 'failed' : current));
    }, EMBED_TIMEOUT_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [shouldLoad, assetId]);

  if (!online) {
    return (
      <PhotoFrame tag="Photo needs a connection">
        <OfflineGoose />
      </PhotoFrame>
    );
  }

  if (state === 'failed') {
    return (
      <PhotoFrame tag="Photo needs a connection">
        <OfflineGoose />
      </PhotoFrame>
    );
  }

  return (
    <PhotoFrame tag={state === 'loaded' ? null : 'Loading photo'} credit={credit}>
      <div className="photo__holder" ref={attachHolder}>
        {shouldLoad ? (
          <iframe
            className="photo__frame"
            src={macaulayEmbedUrl(assetId)}
            title={altText}
            height={EMBED_HEIGHT}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allow="fullscreen"
            onLoad={() => {
              setState('loaded');
            }}
            /*
             * Chrome does not fire this for an HTTP error inside a frame, so
             * the timeout above is the real failure detector. Kept because a
             * browser that does fire it should not wait six seconds.
             */
            onError={() => {
              setState('failed');
            }}
          />
        ) : (
          <Silhouette kind={kind} size={64} />
        )}
      </div>
    </PhotoFrame>
  );
}

/**
 * The photo area of a card: a fixed box with an optional corner tag. Shared by
 * the embed, the Commons image, and the two placeholder states.
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

/** No asset curated yet: the kind silhouette, tagged distinctly from offline. */
export function PhotoComing({ kind }: { kind: Kind }) {
  return (
    <PhotoFrame tag="Photo coming">
      <Silhouette kind={kind} size={72} />
    </PhotoFrame>
  );
}
