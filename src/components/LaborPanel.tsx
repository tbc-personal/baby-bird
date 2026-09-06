import { hrefFor } from '../lib/router';
import { conditionalProbabilityInWindow } from '../lib/laborProbability';
import { formatPercent } from '../lib/percent';
import './LaborPanel.css';

/** The card at the bottom of Today from 34w0d (mockup 4). */
export function LaborPanelCard({ gestationalDays }: { gestationalDays: number }) {
  const chance = conditionalProbabilityInWindow(gestationalDays, gestationalDays + 7);
  return (
    <a className="labor-card" href={hrefFor({ name: 'labor' })}>
      <span className="labor-card__figure mono">{formatPercent(chance)}</span>
      <span className="labor-card__text">
        chance labor starts on its own in the next 7 days, given you&rsquo;re still pregnant
        today
        <span className="labor-card__more">See the daily curve →</span>
      </span>
    </a>
  );
}
