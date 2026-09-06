/**
 * The offline placeholder (ADR-003, mockup 5): a line-drawn goose in a hat with
 * a no-wifi symbol on the crown. Traced from `docs/mockups/goose-offline.svg`
 * with the head simplified from two stacked circles to one, and the eye brow
 * kept. Every stroke is `currentColor` so it follows the skin and reads in dark
 * mode; the head fill uses `--paper` so the neck lines stop at the skull.
 *
 * 21 path commands, under the 40 the build prompt allows.
 */
export function OfflineGoose({ size = 132 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={(size * 120) / 160}
      viewBox="0 0 160 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="A goose wearing a hat with a crossed-out wifi symbol"
    >
      {/* body */}
      <path d="M34 78C30 96 48 104 68 104h44c22 0 30-12 26-26-4-12-20-14-38-12l-40 2c-16 1-24 4-26 10Z" />
      {/* tail */}
      <path d="M36 76 18 64l12 20" />
      {/* wing */}
      <path d="M66 76c18-6 40-2 56 12" />
      {/* neck */}
      <path d="M62 68c-6-14-4-28 4-36" />
      <path d="M78 66c-6-12-6-24 2-32" />
      {/* head */}
      <circle cx="76" cy="30" r="12" fill="var(--paper)" />
      {/* bill */}
      <path d="M87 28 104 32 87 36Z" />
      {/* eye and brow */}
      <circle cx="79" cy="27" r="2" fill="currentColor" stroke="none" />
      <path d="M72 21c3-3 7-3 10 0" />
      {/* hat: brim then crown */}
      <path d="M58 20h38" />
      <path d="M64 20 66 4h22l2 16" />
      {/* no-wifi symbol on the crown */}
      <path d="M71 12a6 6 0 0 1 12 0" />
      <path d="M74 15a3 3 0 0 1 6 0" />
      <circle cx="77" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M70 18 84 6" />
      {/* feet */}
      <path d="M84 104l-2 10m0 0-8 2m8-2 8 2" />
      <path d="M106 104l-2 10m0 0-8 2m8-2 8 2" />
    </svg>
  );
}
