import type { Kind } from '../lib/schema';

/**
 * Three simple marks, one per kind, for timeline rows and for the card when no
 * photo has been curated yet (ADR-003). Drawn in `currentColor` so they follow
 * the skin, and deliberately plain: a seed oval, an egg, and a bird profile.
 */
export function Silhouette({
  kind,
  size = 22,
  title,
}: {
  kind: Kind;
  size?: number;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      {...(title ? {} : { 'aria-hidden': true })}
    >
      {title ? <title>{title}</title> : null}
      {kind === 'seed' ? <Seed /> : null}
      {kind === 'egg' ? <Egg /> : null}
      {kind === 'bird' ? <Bird /> : null}
    </svg>
  );
}

/** A teardrop seed with a single crease. */
function Seed() {
  return (
    <>
      <path d="M16 5c5 4 7 9 7 13a7 7 0 0 1-14 0c0-4 2-9 7-13Z" />
      <path d="M16 11v12" />
    </>
  );
}

/** An egg: taller than wide, narrower at the top. */
function Egg() {
  return <path d="M16 4c5 0 9 7 9 13a9 9 0 0 1-18 0c0-6 4-13 9-13Z" />;
}

/** A perched bird in profile: body, head, bill, tail, legs. */
function Bird() {
  return (
    <>
      <path d="M9 25c-4-3-4-9 1-12 4-2 9-2 12 1" />
      <path d="M22 14c2 2 3 5 3 7 0 3-3 5-7 5h-9" />
      <circle cx="22" cy="10" r="4" />
      <path d="M26 9.5 30.5 11 26 12.5" />
      <path d="M9 25 3.5 23" />
      <path d="M14 26v3M19 26v3" />
    </>
  );
}
