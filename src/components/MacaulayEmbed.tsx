import { useEffect, useRef, useState } from 'react';
import { useOnline } from '../useOnline';
import { OfflineGoose } from './OfflineGoose';
import { Silhouette } from './Silhouette';
import type { Kind } from '../lib/schema';
import { EMBED_HEIGHT, EMBED_TIMEOUT_MS, macaulayEmbedUrl } from './macaulay';
import './Photo.css';

type EmbedState = 'idle' | 'loading' | 'loaded' | 'failed';

export function MacaulayEmbed({
  assetId,
  kind,
  altText,
}: {
  assetId: string;
  kind: Kind;
  altText: string;
}) {
  const online = useOnline();
  const holderRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<EmbedState>('idle');

  // Lazy-load: the frame is only created once the card is near the viewport, so
  // the timeline and a scrolled-past card cost nothing (ADR-003).
  useEffect(() => {
    const holder = holderRef.current;
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
    return () => {
      observer.disconnect();
    };
  }, []);

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
    <PhotoFrame tag={state === 'loaded' ? null : 'Loading photo'}>
      <div className="photo__holder" ref={holderRef}>
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
  children,
}: {
  tag: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="photo">
      {tag ? <span className="photo__tag mono">{tag}</span> : null}
      {children}
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
