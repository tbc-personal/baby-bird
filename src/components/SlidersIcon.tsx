/**
 * The three-sliders mark for the Setup tab. Since Setup absorbed About it holds
 * the date, the display settings and the credits, and no single word covered
 * all three; the sliders read as "the place where things are set".
 *
 * `currentColor` throughout so the tab's active and disabled states carry.
 */
export function SlidersIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
      <circle cx="9" cy="7" r="2.4" fill="var(--paper)" />
      <circle cx="15" cy="12" r="2.4" fill="var(--paper)" />
      <circle cx="7.5" cy="17" r="2.4" fill="var(--paper)" />
    </svg>
  );
}
