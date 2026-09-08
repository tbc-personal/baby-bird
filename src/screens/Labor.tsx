import {
  cdf,
  conditionalProbabilityInWindow,
  CALIBRATION,
  mostLikelyDayFrom,
} from '../lib/laborProbability';
import {
  computeProgress,
  GESTATION_DAYS,
  parseIsoDate,
  TRIMESTER_LABEL,
} from '../lib/gestation';
import { formatShortDate } from '../lib/dates';
import { hrefFor } from '../lib/router';
import { LaborCurve } from '../components/LaborCurve';
import { formatPercent } from '../lib/percent';
import { datingFrom } from '../lib/storage';
import { useAppState } from '../useAppState';
import { addDays } from 'date-fns';
import './Labor.css';

/**
 * Mockup 4. Reached from the card on Today, so the Today tab stays selected
 * (see `activeTab` in lib/router.ts).
 */
export function LaborScreen({ today }: { today: Date }) {
  const { saved, settings, updateSettings } = useAppState();
  if (!saved) return null;

  const inputDate = parseIsoDate(saved.inputDate);
  if (!inputDate) return null;

  const progress = computeProgress(datingFrom(saved, inputDate), today);
  const { gestationalDays } = progress;

  const next7 = conditionalProbabilityInWindow(gestationalDays, gestationalDays + 7);
  const byDueDate = conditionalProbabilityInWindow(gestationalDays, GESTATION_DAYS);
  const likelyDay = mostLikelyDayFrom(gestationalDays);
  const likelyDate = addDays(progress.lmpEquivalent, likelyDay);

  return (
    <>
      <div className="meta">
        <a href={hrefFor({ name: 'today' })}>← Today</a>
        <span className="mono">
          {progress.trimester ? TRIMESTER_LABEL[progress.trimester] : ''} · {progress.weeks}{' '}
          w {progress.days} d
        </span>
      </div>

      <div className="kpi">
        <p className="big kpi__figure">{formatPercent(next7)}</p>
        <p className="small">
          chance labor starts on its own in the next 7 days, given you&rsquo;re still
          pregnant today
        </p>
      </div>

      <div className="dims">
        <div className="dim">
          <b className="mono">{formatPercent(Math.max(byDueDate, 0))}</b>
          <span>by your due date</span>
        </div>
        <div className="dim">
          <b className="mono">{formatShortDate(likelyDate)}</b>
          <span>most likely single day</span>
        </div>
      </div>

      <LaborCurve gestationalDays={gestationalDays} dueDay={GESTATION_DAYS} />

      <div className="caveat">
        <p>
          Population averages for singleton pregnancies with spontaneous onset, with no
          induction or scheduled caesarean. Not a prediction for you, and not medical
          advice.
        </p>
        <p>
          The curve is two overlaid bell curves, one for preterm labor and one for term
          labor, fitted to three published figures: a median of {CALIBRATION.medianDay}{' '}
          days after your period date (
          <a href={CALIBRATION.medianSource}>Smith 2001</a>), a{' '}
          {(CALIBRATION.pretermShare * 100).toFixed(1)}% chance of labor before 37 weeks,
          derived from the <a href={CALIBRATION.cdcSource}>CDC preterm birth rate</a> for{' '}
          {CALIBRATION.cdcYear} by removing multiples and deliveries that were induced or
          scheduled, and a {(CALIBRATION.postTermTargetShare * 100).toFixed(0)}% chance of
          going past 42 weeks (<a href={CALIBRATION.postTermSource}>Smith 2001</a> again).
          Because the model contains no induction at all, it runs a little narrow in the
          last fortnight; <a href={CALIBRATION.jukicSource}>Jukic 2013</a> measures a wider
          spread than the 42-week figure allows for here.
        </p>
        <p className="mono caveat__stat">
          {Math.round(cdf(gestationalDays) * 100)}% have started labor by this point.
        </p>
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => {
            updateSettings({ laborPanelEnabled: false });
          }}
          disabled={!settings.laborPanelEnabled}
        >
          {settings.laborPanelEnabled
            ? 'Hide this panel'
            : 'Hidden. Turn it back on in About'}
        </button>
      </div>
    </>
  );
}
