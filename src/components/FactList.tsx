import type { Fact } from '../lib/schema';

/**
 * ADR-004. Facts are original text with a source. Unreviewed ones carry a
 * "draft" chip, shown only in dev or with `?review=1` so the author can see at
 * a glance what still needs a pass.
 */
export function FactList({
  facts,
  reviewMode,
}: {
  facts: readonly Fact[];
  reviewMode: boolean;
}) {
  if (facts.length === 0) return null;
  return (
    <ul className="facts">
      {facts.map((fact) => (
        <li key={fact.text}>
          {fact.text}
          {reviewMode && !fact.reviewed ? <span className="draft">draft</span> : null}
        </li>
      ))}
    </ul>
  );
}
