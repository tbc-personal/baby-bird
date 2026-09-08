import { useEffect, useId, useRef } from 'react';
import type { Units } from '../lib/storage';
import { MeasureChart, type Measure } from './MeasureChart';
import './MeasureDialog.css';

export type { Measure };

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A real modal for the "tap a measurement" chart, not `useDisclosure` (Setup's
 * "how it's calculated" panel): that one is a popover that closes on an
 * outside tap but leaves the rest of the page live and reachable. This dialog
 * moves focus in on open, traps Tab inside it while open, closes on Escape or
 * a backdrop tap, and returns focus to the inset button that opened it —
 * standard modal-dialog semantics (WAI-ARIA APG), done by hand since the app
 * has no dialog element or focus-trap dependency to reach for.
 */
export function MeasureDialog({
  measure,
  currentWeek,
  units,
  onClose,
  triggerRef,
}: {
  measure: Measure;
  currentWeek: number;
  units: Units;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const box = boxRef.current;
    const trigger = triggerRef.current;
    const focusables = box ? Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
    focusables[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || focusables.length === 0) return;
      // Guarded by the length check above: both indices exist.
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // The dialog unmounts on every close path (Escape, backdrop, the close
      // button), so restoring focus here covers all three at once.
      trigger?.focus();
    };
    // Mount-once: the dialog is remounted (via ComparisonCard's conditional
    // render) whenever `measure` changes, so there is nothing here to react to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = measure === 'length' ? 'Length by week' : 'Weight by week';

  return (
    <div className="measure-dialog">
      <div className="measure-dialog__backdrop" onClick={onClose} />
      <div
        className="measure-dialog__box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={boxRef}
      >
        <div className="measure-dialog__head">
          <h2 id={titleId} className="measure-dialog__title">
            {title}
          </h2>
          <button
            type="button"
            className="measure-dialog__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <MeasureChart measure={measure} currentWeek={currentWeek} units={units} />
      </div>
    </div>
  );
}
