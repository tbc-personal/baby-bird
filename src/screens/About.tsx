import { useState } from 'react';
import { SkinPicker } from '../components/SkinPicker';
import { useAppState } from '../useAppState';
import type { SkinId } from '../skins/ids';
import './About.css';

/**
 * About (mockup state table): skin picker, unit preference, labor panel toggle,
 * sources, credits, the non-commercial statement, the medical disclaimer, and
 * "Forget my data".
 */
export function AboutScreen() {
  const { settings, updateSettings, forget, saved } = useAppState();
  const [confirmingForget, setConfirmingForget] = useState(false);

  return (
    <>
      <h1 className="appname about__title">About Nestling</h1>

      <section className="about__section">
        <h2>Display</h2>
        <SkinPicker
          value={settings.skin}
          onChange={(skin: SkinId) => {
            updateSettings({ skin });
          }}
        />

        <div className="toggle">
          <span className="field__head" id="units-label">
            Units
          </span>
          <div className="segmented" role="group" aria-labelledby="units-label">
            <button
              type="button"
              aria-pressed={settings.units === 'imperial'}
              onClick={() => {
                updateSettings({ units: 'imperial' });
              }}
            >
              in / oz
            </button>
            <button
              type="button"
              aria-pressed={settings.units === 'metric'}
              onClick={() => {
                updateSettings({ units: 'metric' });
              }}
            >
              cm / g
            </button>
          </div>
        </div>

        <label className="toggle toggle--check">
          <input
            type="checkbox"
            checked={settings.laborPanelEnabled}
            onChange={(event) => {
              updateSettings({ laborPanelEnabled: event.target.checked });
            }}
          />
          <span>Show the labor chances panel from 34 weeks</span>
        </label>
      </section>

      <section className="about__section">
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

      <section className="about__section">
        <h2>Where the numbers come from</h2>
        <ul>
          <li>
            Fetal length and weight: the author&rsquo;s own table, drawn from{' '}
            <a href="https://datayze.com/">Datayze</a>. Length is crown to rump through week
            20 and head to heel from week 21, which is why it jumps between them.
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

      <section className="about__section">
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

      <section className="about__section">
        <h2>Non-commercial</h2>
        <p>
          Macaulay Library media may be embedded for non-commercial purposes only. This app
          carries no ads and no paid tier, and must not be used commercially.
        </p>
      </section>

      <section className="about__section">
        <h2>Your data</h2>
        <p>
          Your date and these settings are stored on this device only. There are no
          accounts, no analytics, and nothing is sent anywhere. The only network requests
          the app makes are the photo embeds.
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
