import { useEffect, useId, useRef, useState } from 'react';

export interface Disclosure {
  readonly open: boolean;
  /** Spread onto the trigger button. */
  readonly triggerProps: {
    ref: React.RefObject<HTMLButtonElement>;
    type: 'button';
    'aria-expanded': boolean;
    'aria-controls': string;
    onClick: () => void;
  };
  /** Spread onto the panel element. */
  readonly panelProps: { id: string; hidden: boolean };
  /**
   * Wrap the trigger and the panel in an element carrying this ref so a tap
   * inside either one is not treated as a tap outside.
   */
  readonly containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * A disclosure that closes on a tap outside, on Escape, and on a second press
 * of its trigger. Used by the "how each method is calculated" panel on Setup.
 */
export function useDisclosure(): Disclosure {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && containerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return {
    open,
    containerRef,
    triggerProps: {
      ref: triggerRef,
      type: 'button',
      'aria-expanded': open,
      'aria-controls': panelId,
      onClick: () => {
        setOpen((wasOpen) => !wasOpen);
      },
    },
    panelProps: { id: panelId, hidden: !open },
  };
}
