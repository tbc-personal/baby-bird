/**
 * The Nestling mark: a puffin head in the skin's ink with an accent bill.
 * Inline so it costs no request and follows the skin.
 */
export function AppMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M16 3c6 0 10 4.4 10 10.5S22.2 29 16 29 6 20.6 6 13.5 10 3 16 3Z"
        fill="currentColor"
      />
      <circle cx="12.5" cy="12" r="4" fill="var(--paper)" />
      <circle cx="12.5" cy="12" r="1.6" fill="currentColor" />
      <path d="M20 11.5 30 14l-10 2.5Z" fill="var(--accent)" />
    </svg>
  );
}
