import { useState } from 'react';
import { useAppState } from '../useAppState';
import './Settings.css';

/**
 * Everything the old About screen said below the settings: limitations, where
 * the numbers come from, credits, the non-commercial statement, and the privacy
 * copy with "Forget my data".
 *
 * It sits at the bottom of Setup now. The privacy copy stays here and out of
 * the date form above it (ADR-006): the form asks for the date, this explains
 * what happens to it.
 */
export function AboutContent() {
  const { forget, saved } = useAppState();
  const [confirmingForget, setConfirmingForget] = useState(false);

  return (
    <>
      <section className="section">
        <h2>Limitations</h2>
        <p>
          Fetal sizes are population averages. The labor chances are population statistics
          for singleton pregnancies with spontaneous onset, not a prediction about any one
          pregnancy. This is not medical advice. Talk to your clinician.
        </p>
        <p className="small">
          A &ldquo;chance of continuing&rdquo; panel for early pregnancy is planned but not
          built. It is deferred to a later version and will be opt-in and permanently
          hideable (ADR-005), coming later.
        </p>
      </section>

      <section className="section">
        <h2>Where the numbers come from</h2>
        <ul>
          <li>
            Fetal length and weight: the author&rsquo;s own table, drawn from{' '}
            <a href="https://datayze.com/">Datayze</a>. Length is crown to rump through week
            20 and head to heel from week 21, which is why it jumps between them.
          </li>
          <li>
            Due dates count 280 days from the first day of your last period, adjusted for
            your cycle length: a cycle longer than 28 days means later ovulation and a later
            due date (ADR-002).
          </li>
          <li>
            Labor model: a two-part fit, one bell curve for preterm labor and one for term
            labor, calibrated to Smith 2001 (median 283 days, 6% past 42 weeks), the
            CDC/NCHS preterm share, and{' '}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3777570/">
              Jukic et al. 2013
            </a>
            . Datayze inspired the feature; none of its data is used.
          </li>
          <li>The bird comparisons are the author&rsquo;s own pairings.</li>
        </ul>
      </section>

      <section className="section">
        <h2>Credits</h2>
        <ul>
          <li>
            Bird photographs:{' '}
            <a href="https://www.macaulaylibrary.org/">Macaulay Library</a> at the Cornell
            Lab of Ornithology, embedded with credit to each photographer.
          </li>
          <li>
            Seed photographs: Wikimedia Commons contributors, credited and licensed on each
            image.
          </li>
          <li>Bird facts are original text written for this app.</li>
        </ul>
      </section>

      <section className="section">
        <h2>Non-commercial</h2>
        <p>
          Macaulay Library media may be embedded for non-commercial purposes only. This app
          carries no ads and no paid tier, and must not be used commercially.
        </p>
      </section>

      <section className="section section--last">
        <h2>Your data</h2>
        <p>
          Your date and these settings are stored on this device only. There are no
          accounts, no analytics, and nothing is sent anywhere. The only network requests
          the app makes are the photo embeds. A link you copy above carries your due date
          and nothing else.
        </p>
        {confirmingForget ? (
          <div className="sheet">
            <p className="sheet__title">Forget your saved date and settings?</p>
            <div className="sheet__actions">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  forget();
                  setConfirmingForget(false);
                }}
              >
                Forget it
              </button>
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => {
                  setConfirmingForget(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn--quiet"
            disabled={!saved}
            onClick={() => {
              setConfirmingForget(true);
            }}
          >
            Forget my data
          </button>
        )}
      </section>
    </>
  );
}
